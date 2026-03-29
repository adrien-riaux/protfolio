import { describe, expect, test } from 'bun:test';
import { buildSystemPrompt, checkRateLimit, sanitizeMessages } from '../src/lib/chat.js';

describe('sanitizeMessages', () => {
  test('keeps only user and assistant roles', () => {
    const result = sanitizeMessages([
      { role: 'system', content: 'ignore' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' }
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].role).toBe('user');
    expect(result[1].role).toBe('assistant');
  });

  test('caps message size', () => {
    const long = 'a'.repeat(5000);
    const result = sanitizeMessages([{ role: 'user', content: long }]);
    expect(result[0].content.length).toBe(2000);
  });
});

describe('checkRateLimit', () => {
  test('blocks when max is reached', () => {
    const store = new Map<string, { count: number; resetAt: number }>();
    expect(checkRateLimit('127.0.0.1', store, 1)).toBe(true);
    expect(checkRateLimit('127.0.0.1', store, 1)).toBe(false);
  });
});

describe('buildSystemPrompt', () => {
  test('uses only PROFILE context blocks', async () => {
    const prompt = await buildSystemPrompt();

    expect(prompt).toContain('=== PROFILE ===');
    expect(prompt).not.toContain('=== ACHIEVEMENTS ===');
    expect(prompt).not.toContain('=== CERTIFICATIONS ===');
  });
});
