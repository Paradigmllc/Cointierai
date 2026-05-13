/**
 * GitHub REST v3 — developer activity for crypto projects.
 * Unauthenticated: 60 req/h. With token: 5,000 req/h.
 * Maps a `org/repo` slug from CoinGecko's `links.repos_url.github[0]`.
 */

const BASE = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN;

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Cointier/0.1',
  };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  return h;
}

async function ghFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20_000),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  return (await res.json()) as T;
}

export interface GhRepo {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  subscribers_count: number;
  pushed_at: string;
  created_at: string;
  description: string | null;
  language: string | null;
}

export interface GhCommitActivity {
  /** weekly commit counts for last 52 weeks (Sunday start). */
  total: number;
  week: number;
  days: number[];
}

/** Convert a github URL like https://github.com/bitcoin/bitcoin → "bitcoin/bitcoin". */
export function parseRepoSlug(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+\/[^/?#]+)/i);
  return m ? m[1].replace(/\.git$/, '') : null;
}

export async function getRepo(slug: string): Promise<GhRepo | null> {
  return ghFetch<GhRepo>(`/repos/${slug}`).catch(() => null);
}

/** Returns 52 weekly commit totals. May 202 = "Computing, try again". */
export async function getCommitActivity(slug: string): Promise<GhCommitActivity[] | null> {
  try {
    const res = await fetch(`${BASE}/repos/${slug}/stats/commit_activity`, {
      headers: headers(),
      signal: AbortSignal.timeout(20_000),
      next: { revalidate: 6 * 3600 },
    });
    if (res.status === 202) return null; // still computing
    if (!res.ok) return null;
    return (await res.json()) as GhCommitActivity[];
  } catch {
    return null;
  }
}

export async function getContributorCount(slug: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/repos/${slug}/contributors?per_page=1&anon=true`, {
      headers: headers(),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const link = res.headers.get('Link');
    if (link) {
      const m = link.match(/page=(\d+)>; rel="last"/);
      if (m) return Number(m[1]);
    }
    const arr = (await res.json()) as unknown[];
    return arr.length;
  } catch {
    return null;
  }
}
