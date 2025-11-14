import HostView from '@/components/HostView';

export default async function HostGamePage({ params }) {
  const { gameId } = await params;
  return <HostView gamePin={gameId} />;
}
