import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import GameSession from '@/models/GameSession';
import Event from '@/models/Event';

export async function DELETE(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { sessionId } = await params;
  const gameSession = await GameSession.findById(sessionId);

  if (!gameSession) {
    return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
  }

  if (gameSession.hostId && gameSession.hostId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  await GameSession.deleteOne({ _id: sessionId });
  if (gameSession.eventId) {
    await Event.findByIdAndUpdate(gameSession.eventId, { $pull: { sessions: sessionId } });
  }

  return NextResponse.json({ success: true });
}
