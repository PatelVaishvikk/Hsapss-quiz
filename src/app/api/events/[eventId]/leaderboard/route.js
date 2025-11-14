import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';
import GameSession from '@/models/GameSession';

export async function GET(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const eventId = (await params).eventId;

  const event = await Event.findById(eventId).lean();

  if (!event || event.hostId.toString() !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
  }

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
      averageScore: entry.quizzesPlayed > 0 ? Math.round(entry.totalScore / entry.quizzesPlayed) : 0,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  return NextResponse.json({
    success: true,
    event,
    sessions: sessionLeaderboards,
    aggregate: aggregateLeaderboard,
  });
}
