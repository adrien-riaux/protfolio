import type { ChatMessage } from './types.js';
import { readAchievements, readCertifications, readProfileMarkdown } from './data.js';

const MAX_HISTORY = 10;
const MAX_MESSAGE_LENGTH = 2000;

export function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== 'object') {
        return false;
      }

      const role = (message as ChatMessage).role;
      const content = (message as ChatMessage).content;
      return (role === 'user' || role === 'assistant') && typeof content === 'string';
    })
    .slice(-MAX_HISTORY)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH)
    }));
}

export async function buildSystemPrompt(): Promise<string> {
  const [profile, achievements, certifications] = await Promise.all([
    readProfileMarkdown(),
    readAchievements(),
    readCertifications()
  ]);

  return `You are an AI assistant representing the portfolio owner.
Answer questions only about the owner, their work, and their achievements.
Speak in first person when appropriate and stay concise and honest.
If information is unknown, clearly say you do not know.
Do not fabricate details.

=== PROFILE ===
${profile}

=== ACHIEVEMENTS ===
${JSON.stringify(achievements, null, 2)}

=== CERTIFICATIONS ===
${JSON.stringify(certifications, null, 2)}`;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  store: Map<string, RateLimitEntry>,
  maxRequests = 20,
  windowMs = 3_600_000
): boolean {
  const now = Date.now();
  const current = store.get(key);

  if (current && now < current.resetAt) {
    if (current.count >= maxRequests) {
      return false;
    }

    current.count += 1;
    return true;
  }

  store.set(key, {
    count: 1,
    resetAt: now + windowMs
  });

  return true;
}
