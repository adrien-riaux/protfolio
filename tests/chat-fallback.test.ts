import { afterEach, describe, expect, test } from 'bun:test';
import handler from '../api/chat.js';

const FALLBACK_MODEL = 'Prism-ML/Ternary-Bonsai-27B';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.TOGETHER_API_KEY;
});

function createResponseCapture() {
  const headers: Record<string, string> = {};
  return {
    headers,
    statusCode: 0,
    body: '',
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
    end(payload?: string) {
      this.body = payload ?? '';
    }
  };
}

describe('chat fallback', () => {
  test('uses fallback model when primary fails', async () => {
    process.env.TOGETHER_API_KEY = 'test-key';
    const requestedModels: string[] = [];

    globalThis.fetch = (async (_url: unknown, options: unknown) => {
      const payload = JSON.parse((options as { body: string }).body) as { model: string };
      requestedModels.push(payload.model);

      if (requestedModels.length === 1) {
        throw new Error('primary boom');
      }

      const sse =
        'data: {"choices":[{"delta":{"content":"fallback "}}]}\n' +
        'data: {"choices":[{"delta":{"content":"ok"}}]}\n' +
        'data: [DONE]\n';

      return {
        ok: true,
        status: 200,
        headers: { get: () => 'text/event-stream' },
        text: async () => sse
      };
    }) as unknown as typeof fetch;

    const response = createResponseCapture();
    await handler(
      {
        method: 'POST',
        headers: { 'x-chat-session-id': `fallback-test-${Date.now()}` },
        body: { messages: [{ role: 'user', content: 'hello' }] }
      },
      response
    );

    expect(requestedModels).toHaveLength(2);
    expect(response.statusCode).toBe(200);
    expect(response.headers['X-Chat-Model']).toBe(FALLBACK_MODEL);
    expect(response.body).toBe('fallback ok');
  });
});
