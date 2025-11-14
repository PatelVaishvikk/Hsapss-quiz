import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/models/Quiz';
import GameSession from '@/models/GameSession';
import Event from '@/models/Event';

export async function GET(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { quizId } = await params;
  const quiz = await Quiz.findOne({ _id: quizId, createdBy: session.user.id }).lean();

  if (!quiz) {
    return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, quiz });
}

export async function PATCH(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { quizId } = await params;
  const updates = await request.json();

  const quiz = await Quiz.findOneAndUpdate(
    { _id: quizId, createdBy: session.user.id },
    updates,
    { new: true },
  );

  if (!quiz) {
    return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, quiz });
}

export async function DELETE(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { quizId } = await params;
  const quiz = await Quiz.findOneAndDelete({ _id: quizId, createdBy: session.user.id });

  if (!quiz) {
    return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
  }

  const linkedSessions = await GameSession.find({ quizId }).select('_id eventId').lean();
  const sessionIds = linkedSessions.map((item) => item._id);
  if (sessionIds.length) {
    await GameSession.deleteMany({ _id: { $in: sessionIds } });
    const eventIds = [...new Set(linkedSessions.map((item) => item.eventId).filter(Boolean))];
    if (eventIds.length) {
      await Event.updateMany(
        { _id: { $in: eventIds } },
        { $pull: { sessions: { $in: sessionIds } } },
      );
    }
  }

  return NextResponse.json({ success: true });
}
