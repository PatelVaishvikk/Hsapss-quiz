import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import GameSession from '@/models/GameSession';
import SessionManager from '@/components/SessionManager';

export default async function SessionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  await dbConnect();

  const sessions = await GameSession.find({ hostId: session.user.id })
    .sort({ createdAt: -1 })
    .populate('quizId')
    .populate('eventId')
    .lean();

  return (
    <SessionManager
      sessions={JSON.parse(JSON.stringify(sessions))}
    />
  );
}
