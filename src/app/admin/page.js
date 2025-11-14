import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import Quiz from '@/models/Quiz';
import AdminDashboard from '@/components/AdminDashboard';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  await dbConnect();
  const [events, quizzes] = await Promise.all([
    Event.find({ hostId: session.user.id })
      .populate({
        path: 'sessions',
        select: 'gamePin status quizId createdAt',
        populate: { path: 'quizId', select: 'title' },
      })
      .sort({ createdAt: -1 })
      .lean(),
    Quiz.find({ createdBy: session.user.id }).sort({ createdAt: -1 }).lean(),
  ]);

  return (
    <AdminDashboard
      host={session.user}
      events={JSON.parse(JSON.stringify(events))}
      quizzes={JSON.parse(JSON.stringify(quizzes))}
    />
  );
}
