import { readFile } from 'node:fs/promises';

type BunLike = {
  env?: Record<string, string | undefined>;
  file?: (path: URL | string) => {
    text: () => Promise<string>;
    json: <T = unknown>() => Promise<T>;
  };
};

function getBunRuntime(): BunLike | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const candidate = (globalThis as { Bun?: BunLike }).Bun;
  return candidate ?? null;
}

export function getEnv(name: string): string | undefined {
  const bun = getBunRuntime();
  if (bun?.env) {
    return bun.env[name];
  }

  return process.env[name];
}

export async function readTextFile(path: URL): Promise<string> {
  const bun = getBunRuntime();
  if (bun?.file) {
    return bun.file(path).text();
  }

  return readFile(path, 'utf8');
}

export async function readJsonFile<T>(path: URL): Promise<T> {
  const bun = getBunRuntime();
  if (bun?.file) {
    return bun.file(path).json<T>();
  }

  const content = await readFile(path, 'utf8');
  return JSON.parse(content) as T;
}
