export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  issuedAt: string;
  verifyUrl: string;
  badgeImage: string;
}

export interface GitHubRepo {
  name: string;
  url: string;
  stars: number;
  language: string;
  description: string;
}

export interface GitHubStats {
  username: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  topLanguages: string[];
  topRepos: GitHubRepo[];
}

export interface StackOverflowStats {
  userId: number;
  reputation: number;
  badgeCounts: {
    gold: number;
    silver: number;
    bronze: number;
  };
  answerCount: number;
  questionCount: number;
  viewCount: number;
  profileUrl: string;
}

export interface KaggleStats {
  username: string;
  rank: string;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
  competitions: number;
  datasets: number;
  notebooks: number;
}

export interface Achievements {
  github: GitHubStats;
  stackoverflow: StackOverflowStats;
  kaggle: KaggleStats;
}
