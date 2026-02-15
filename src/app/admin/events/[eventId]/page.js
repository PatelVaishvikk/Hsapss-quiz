import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import GameSession from '@/models/GameSession';
import Quiz from '@/models/Quiz';
import EventDetail from '@/components/EventDetail';

export default async function EventPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  const { eventId } = await params;
  await dbConnect();

  const event = await Event.findOne({ _id: eventId, hostId: session.user.id })
    .populate({
      path: 'sessions',
      populate: { path: 'quizId' },
    })
    .lean();

  if (!event) {
    notFound();
  }

  const quizzes = await Quiz.find({ createdBy: session.user.id }).lean();
  const sessions = await GameSession.find({ eventId }).populate('quizId').lean();

  const sessionLeaderboards = sessions.map((game) => ({
    id: game._id,
    quizTitle: game.quizId?.title || 'Quiz',
    status: game.status,
    gamePin: game.gamePin,
    players: game.players
      .map((player) => ({ name: player.name, score: player.score, answers: player.answers }))
      .sort((a, b) => b.score - a.score),
  }));

  const aggregateMap = new Map();
  sessions.forEach((game) => {
    game.players.forEach((player) => {
      const key = player.name.toLowerCase();
      if (!aggregateMap.has(key)) {
        aggregateMap.set(key, {
          name: player.name,
          totalScore: 0,
          quizzesPlayed: 0,
        });
      }
      const record = aggregateMap.get(key);
      record.totalScore += player.score;
      record.quizzesPlayed += 1;
    });
  });

  const aggregateLeaderboard = Array.from(aggregateMap.values())
    .map((entry) => ({
      ...entry,
      averageScore: entry.quizzesPlayed ? Math.round(entry.totalScore / entry.quizzesPlayed) : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return (
    <EventDetail
      event={JSON.parse(JSON.stringify(event))}
      leaderboards={JSON.parse(JSON.stringify(sessionLeaderboards))}
      aggregate={aggregateLeaderboard}
      quizzes={JSON.parse(JSON.stringify(quizzes))}
    />
  );
}
