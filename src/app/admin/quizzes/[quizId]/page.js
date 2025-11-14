import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';
import dbConnect from '@/lib/mongodb';
import Quiz from '@/models/Quiz';
import QuizCreator from '@/components/QuizCreator';

export default async function EditQuizPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { quizId } = await params;
  await dbConnect();
  const quiz = await Quiz.findOne({ _id: quizId, createdBy: session.user.id }).lean();

  if (!quiz) {
    notFound();
  }

  const sanitized = JSON.parse(JSON.stringify(quiz));

  return (
    <QuizCreator initialQuiz={sanitized} mode="edit" quizId={quizId} />
  );
}
