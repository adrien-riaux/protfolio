import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import Together from 'together-ai';
import { buildSystemPrompt, checkRateLimit, sanitizeMessages } from '../src/lib/chat';
import type { ChatRequest } from '../src/lib/types';
import { getEnv } from '../src/lib/runtime';

export const runtime = 'nodejs';

const model = 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free';
const app = new Hono();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

app.post('/api/chat', async (context) => {
  const ip = context.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  if (!checkRateLimit(ip, rateLimitStore, 20)) {
    return context.json({ error: 'Rate limit exceeded. Please retry later.' }, 429);
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
