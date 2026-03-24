import type { GitHubRepo, GitHubStats } from './types';
import { readFallbackAchievements } from './data';
import { getEnv } from './runtime';

function getTopLanguages(repos: Array<{ language: string | null }>): string[] {
  const frequency = new Map<string, number>();
  for (const repo of repos) {
    if (!repo.language) continue;
    frequency.set(repo.language, (frequency.get(repo.language) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([language]) => language);
}

export async function fetchGitHubStats(): Promise<GitHubStats> {
  const username = getEnv('GITHUB_USERNAME');
  if (!username) {
    const fallback = await readFallbackAchievements();
    return fallback.github;
  }

  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'portfolio-build'
  };

  const githubToken = getEnv('GITHUB_TOKEN');
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100`, { headers })
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error(`GitHub API failed: user ${userRes.status}, repos ${reposRes.status}`);
    }

    const user = await userRes.json() as {
      public_repos: number;
      followers: number;
      following: number;
      login: string;
    };

    const repos = await reposRes.json() as Array<{
      name: string;
      html_url: string;
      stargazers_count: number;
      language: string | null;
      description: string | null;
      fork: boolean;
    }>;

    const nonForkRepos = repos.filter((repo) => !repo.fork);
    const topRepos: GitHubRepo[] = nonForkRepos.slice(0, 6).map((repo) => ({
      name: repo.name,
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language ?? 'N/A',
      description: repo.description ?? 'No description provided.'
    }));

    const totalStars = nonForkRepos.reduce((acc, repo) => acc + repo.stargazers_count, 0);

    return {
      username: user.login,
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      totalStars,
      topLanguages: getTopLanguages(nonForkRepos),
      topRepos
    };
  } catch (error) {
    console.warn('GitHub fetch failed, using fallback:', error);
    const fallback = await readFallbackAchievements();
    return fallback.github;
  }
}
