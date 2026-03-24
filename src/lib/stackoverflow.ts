import type { StackOverflowStats } from './types';
import { readFallbackAchievements } from './data';
import { getEnv } from './runtime';

export async function fetchStackOverflowStats(): Promise<StackOverflowStats> {
  const userId = getEnv('STACKOVERFLOW_USER_ID');
  if (!userId) {
    const fallback = await readFallbackAchievements();
    return fallback.stackoverflow;
  }

  const key = getEnv('STACKOVERFLOW_KEY');
  const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
  const url = `https://api.stackexchange.com/2.3/users/${encodeURIComponent(
    userId
  )}?site=stackoverflow${keyParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`StackOverflow API failed: ${res.status}`);
    }

    const payload = await res.json() as {
      items: Array<{
        user_id: number;
        reputation: number;
        badge_counts: { gold: number; silver: number; bronze: number };
        answer_count: number;
        question_count: number;
        view_count: number;
        link: string;
      }>;
    };

    const item = payload.items[0];
    if (!item) {
      throw new Error('StackOverflow API returned no user data');
    }

    return {
      userId: item.user_id,
      reputation: item.reputation,
      badgeCounts: item.badge_counts,
      answerCount: item.answer_count,
      questionCount: item.question_count,
      viewCount: item.view_count,
      profileUrl: item.link
    };
  } catch (error) {
    console.warn('StackOverflow fetch failed, using fallback:', error);
    const fallback = await readFallbackAchievements();
    return fallback.stackoverflow;
  }
}
