import PlayerView from '@/components/PlayerView';

export default async function PlayerGamePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const initialName = resolvedSearchParams?.name ? decodeURIComponent(resolvedSearchParams.name) : '';
  return <PlayerView gamePin={resolvedParams.gameId} initialName={initialName} />;
}
