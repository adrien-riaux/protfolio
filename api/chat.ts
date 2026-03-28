import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import Together from 'together-ai';
import { buildSystemPrompt, checkRateLimit, sanitizeMessages } from '../src/lib/chat.js';
import type { ChatRequest } from '../src/lib/types.js';
import { getEnv } from '../src/lib/runtime.js';

const model = getEnv('CHAT_MODEL') ?? 'openai/gpt-oss-120b';
const app = new Hono();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function sanitizeSessionId(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

app.post('/api/chat', async (context) => {
  const ip = context.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const sessionId = sanitizeSessionId(context.req.header('x-chat-session-id'));
  const rateLimitKey = sessionId ? `session:${sessionId}` : `ip:${ip}`;

  if (!checkRateLimit(rateLimitKey, rateLimitStore, 5, 43_200_000)) {
    return context.json({ error: 'Rate limit exceeded: 5 questions per session.' }, 429);
  }

  const apiKey = getEnv('TOGETHER_API_KEY');
  if (!apiKey) {
    return context.json({ error: 'TOGETHER_API_KEY is missing.' }, 500);
  }

  let body: ChatRequest;
  try {
    body = await context.req.json();
  } catch {
    return context.json({ error: 'Invalid JSON payload.' }, 400);
  }

  const safeMessages = sanitizeMessages(body.messages);
  if (safeMessages.length === 0) {
    return context.json({ error: 'messages must include at least one valid user message.' }, 400);
  }

  const together = new Together({ apiKey });

  try {
    const systemPrompt = await buildSystemPrompt();
    const stream = await together.chat.completions.create({
      model,
      stream: true,
      temperature: 0.6,
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...safeMessages]
    });

    const responseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('TogetherAI request failed:', error);
    return context.json({ error: 'AI service temporarily unavailable.' }, 503);
  }
});

export default handle(app);
