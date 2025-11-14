import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/models/Quiz';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request) {
  await dbConnect();

  try {
    const body = await request.json();
    const quiz = await Quiz.create(body);
    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function GET(request) {
  await dbConnect();

  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('host');
    const query = createdBy ? { createdBy } : {};
    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, quizzes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
