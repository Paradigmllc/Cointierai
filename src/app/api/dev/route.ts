/**
 * GitHub developer activity proxy. Used by <DeveloperPanel/>.
 */
import { NextResponse } from 'next/server';
import { parseRepoSlug, getRepo, getCommitActivity, getContributorCount } from '@/lib/api/github';

export const revalidate = 21600;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ghUrl = url.searchParams.get('url') ?? '';
  const slug = parseRepoSlug(ghUrl);
  if (!slug) return NextResponse.json({ error: 'invalid_url' }, { status: 400 });

  const [repo, activity, contributors] = await Promise.all([
    getRepo(slug),
    getCommitActivity(slug),
    getContributorCount(slug),
  ]);
  if (!repo) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const weeklyCommits = activity ? activity.map((w) => w.total) : [];
  return NextResponse.json({
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    watchers: repo.watchers_count,
    subscribers: repo.subscribers_count,
    openIssues: repo.open_issues_count,
    language: repo.language,
    pushedAt: repo.pushed_at,
    weeklyCommits,
    contributors,
  });
}
