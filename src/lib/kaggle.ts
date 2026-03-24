import type { KaggleStats } from './types';
import { readFallbackAchievements } from './data';

export async function getKaggleStats(): Promise<KaggleStats> {
  const fallback = await readFallbackAchievements();
  return fallback.kaggle;
}
