import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GameSession from '@/models/GameSession';
import Quiz from '@/models/Quiz';
import Event from '@/models/Event';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function generateUniquePin() {
  let pin;
  let exists = true;

  while (exists) {
    pin = generatePin();
    exists = await GameSession.exists({ gamePin: pin });
  }

  return pin;
}

export async function POST(request) {
  await dbConnect();

  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId, eventId } = await request.json();

    if (!quizId) {
      return NextResponse.json({ success: false, error: 'Quiz ID is required' }, { status: 400 });
    }

    const quiz = await Quiz.findOne({ _id: quizId, createdBy: authSession.user.id });

    if (!quiz) {
      return NextResponse.json({ success: false, error: 'Quiz not found' }, { status: 404 });
    }

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event || event.hostId.toString() !== authSession.user.id) {
        return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
      }
    }

    const gamePin = await generateUniquePin();
    const gameSession = await GameSession.create({
      quizId: quiz._id,
      eventId,
      gamePin,
      status: 'waiting',
      currentQuestion: 0,
      hostId: authSession.user.id,
    });

    if (eventId) {
      await Event.findByIdAndUpdate(eventId, { $addToSet: { sessions: gameSession._id } });
    }

    await gameSession.populate('quizId');

    return NextResponse.json({ success: true, session: gameSession });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const gamePin = searchParams.get('pin');

    if (!gamePin) {
      return NextResponse.json({ success: false, error: 'Game pin is required' }, { status: 400 });
    }

    const session = await GameSession.findOne({ gamePin }).populate('quizId');

    if (!session) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request) {
  await dbConnect();

  try {
    const { action, gamePin, playerName, answer, questionIndex, timeSpent } = await request.json();

    if (!action || !gamePin) {
      return NextResponse.json({ success: false, error: 'Action and game pin are required' }, { status: 400 });
    }

    const session = await GameSession.findOne({ gamePin }).populate('quizId');

    if (!session) {
      return NextResponse.json({ success: false, error: 'Game not found' }, { status: 404 });
    }

    const quiz = session.quizId;

    if ((action === 'join' || action === 'answer') && !playerName) {
      return NextResponse.json({ success: false, error: 'Player name is required' }, { status: 400 });
    }

    switch (action) {
      case 'join': {
        if (session.status !== 'waiting') {
          return NextResponse.json({ success: false, error: 'Game already started' }, { status: 400 });
        }

        const normalizedName = playerName.trim();
        const alreadyJoined = session.players.some((player) => player.name.toLowerCase() === normalizedName.toLowerCase());

        if (!alreadyJoined) {
          session.players.push({ name: normalizedName });
        }

        await session.save();
        await session.populate('quizId');
        return NextResponse.json({ success: true, session });
      }
      case 'start': {
        session.status = 'active';
        session.currentQuestion = 0;
        await session.save();
        await session.populate('quizId');
        return NextResponse.json({ success: true, session });
      }
      case 'advance': {
        if (session.currentQuestion < quiz.questions.length - 1) {
          session.currentQuestion += 1;
        } else {
          session.status = 'finished';
        }
        await session.save();
        await session.populate('quizId');
        return NextResponse.json({ success: true, session });
      }
      case 'reset': {
        session.status = 'waiting';
        session.currentQuestion = 0;
        session.players.forEach((player) => {
          player.score = 0;
          player.answers = [];
        });
        await session.save();
        await session.populate('quizId');
        return NextResponse.json({ success: true, session });
      }
      case 'answer': {
        if (session.status !== 'active') {
          return NextResponse.json({ success: false, error: 'Game is not active' }, { status: 400 });
        }

        const normalizedName = playerName.trim();
        const player = session.players.find((p) => p.name === normalizedName);

        if (!player) {
          return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
        }

        const question = quiz.questions[questionIndex];

        if (!question) {
          return NextResponse.json({ success: false, error: 'Invalid question index' }, { status: 400 });
        }

        const alreadyAnswered = player.answers.some((entry) => entry.questionIndex === questionIndex);

        if (alreadyAnswered) {
          await session.populate('quizId');
          return NextResponse.json({ success: true, session });
        }

        const isCorrect = question.correctAnswer === answer;
        const baseScore = isCorrect ? 1000 : 0;
        const bonus = isCorrect ? Math.max(question.timeLimit - (timeSpent || 0), 0) * 10 : 0;

        player.answers.push({
          questionIndex,
          answer,
          correct: isCorrect,
          timeSpent,
        });

        if (isCorrect) {
          player.score += baseScore + bonus;
        }

        await session.save();
        await session.populate('quizId');
        return NextResponse.json({ success: true, session });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
