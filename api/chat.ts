import { buildSystemPrompt, checkRateLimit, sanitizeMessages } from '../src/lib/chat.js';
import type { ChatRequest } from '../src/lib/types.js';
import { getEnv } from '../src/lib/runtime.js';

const PRIMARY_MODEL = 'openai/gpt-oss-120b';
const FALLBACK_MODEL = 'ServiceNow-AI/Apriel-1.6-15b-Thinker';
const MODEL_REQUEST_TIMEOUT_MS = 20_000;
const TOGETHER_CHAT_COMPLETIONS_URL = 'https://api.together.xyz/v1/chat/completions';
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

type RequestLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  on?: (event: 'data' | 'end' | 'error', callback: (chunk?: unknown) => void) => void;
};

type ResponseLike = {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

function getHeader(request: RequestLike, name: string): string | undefined {
  const key = name.toLowerCase();
  const value = request.headers?.[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function sendJson(response: ResponseLike, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: RequestLike): Promise<unknown> {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  if (typeof request.body === 'string' && request.body.trim().length > 0) {
    return JSON.parse(request.body);
  }

  if (!request.on) {
    throw new Error('Request body stream is not available.');
  }

  const rawBody = await new Promise<string>((resolve, reject) => {
    let data = '';

    request.on?.('data', (chunk) => {
      data += String(chunk ?? '');
    });

    request.on?.('end', () => {
      resolve(data);
    });

    request.on?.('error', () => {
      reject(new Error('Failed to read request body.'));
    });
  });

  if (rawBody.trim().length === 0) {
    throw new Error('Request body is empty.');
  }

  return JSON.parse(rawBody);
}

async function requestCompletion(
  apiKey: string,
  model: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, MODEL_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TOGETHER_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 500,
        messages
      }),
      signal: controller.signal
    });

    const payload = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: unknown } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(payload.error?.message ?? `TogetherAI request failed with status ${response.status}`);
    }

    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('TogetherAI returned an empty completion.');
    }

    return content;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`Model request (${model}) timed out after ${MODEL_REQUEST_TIMEOUT_MS}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeSessionId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export default async function handler(request: RequestLike, response: ResponseLike): Promise<void> {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'POST');
    response.end('Method Not Allowed');
    return;
  }

  const ip = getHeader(request, 'x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const sessionId = sanitizeSessionId(getHeader(request, 'x-chat-session-id') ?? null);
  const rateLimitKey = sessionId ? `session:${sessionId}` : `ip:${ip}`;

  if (!checkRateLimit(rateLimitKey, rateLimitStore, 5, 43_200_000)) {
    sendJson(response, 429, { error: 'Rate limit exceeded: 5 questions per session.' });
    return;
  }

  const apiKey = getEnv('TOGETHER_API_KEY');
  if (!apiKey) {
    sendJson(response, 500, { error: 'TOGETHER_API_KEY is missing.' });
    return;
  }

  let body: ChatRequest;
  try {
    body = (await readJsonBody(request)) as ChatRequest;
  } catch {
    sendJson(response, 400, { error: 'Invalid JSON payload.' });
    return;
  }

  const safeMessages = sanitizeMessages(body.messages);
  if (safeMessages.length === 0) {
    sendJson(response, 400, { error: 'messages must include at least one valid user message.' });
    return;
  }

  try {
    const systemPrompt = await buildSystemPrompt();
    const modelMessages = [{ role: 'system', content: systemPrompt }, ...safeMessages] as Array<{
      role: 'system' | 'user' | 'assistant';
      content: string;
    }>;

    let selectedModel = PRIMARY_MODEL;
    let responseText: string;

    try {
      responseText = await requestCompletion(apiKey, PRIMARY_MODEL, modelMessages);
    } catch (primaryError) {
      selectedModel = FALLBACK_MODEL;
      console.warn(`Primary model failed (${PRIMARY_MODEL}), falling back to ${FALLBACK_MODEL}.`, primaryError);
      responseText = await requestCompletion(apiKey, FALLBACK_MODEL, modelMessages);
    }

    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/plain; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Chat-Model', selectedModel);
    response.end(responseText);
    return;
  } catch (error) {
    console.error('TogetherAI request failed:', error);
    sendJson(response, 503, { error: 'AI service temporarily unavailable.' });
    return;
  }
}
