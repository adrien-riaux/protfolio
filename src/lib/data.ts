import type { Achievements, Certification } from './types';
import { readJsonFile, readTextFile } from './runtime';

const achievementsPath = new URL('../../context/achievements.json', import.meta.url);
const certificationsPath = new URL('../../context/certifications.json', import.meta.url);
const profilePath = new URL('../../context/PROFILE.md', import.meta.url);

export async function readFallbackAchievements(): Promise<Achievements> {
  return readJsonFile<Achievements>(achievementsPath);
}

export async function readCertifications(): Promise<Certification[]> {
  return readJsonFile<Certification[]>(certificationsPath);
}

export async function readProfileMarkdown(): Promise<string> {
  return readTextFile(profilePath);
}
