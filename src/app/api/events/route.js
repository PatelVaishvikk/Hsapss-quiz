import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const events = await Event.find({ hostId: session.user.id })
    .populate({
      path: 'sessions',
      select: 'gamePin status createdAt quizId players',
      populate: { path: 'quizId', select: 'title' },
    })
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, events });
}

export async function POST(request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, scheduledAt } = body;
    const event = await Event.create({
      title,
      description,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      hostId: session.user.id,
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ success: false, error: 'Event ID is required' }, { status: 400 });
    }

    const event = await Event.findOne({ _id: eventId, hostId: session.user.id });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    await Event.deleteOne({ _id: eventId });
    const sessionIds = event.sessions || [];
    if (sessionIds.length) {
      await GameSession.deleteMany({ _id: { $in: sessionIds } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
