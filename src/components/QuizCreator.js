'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const defaultQuestion = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
};

const buildEmptyQuiz = () => ({
  title: '',
  description: '',
  questions: [],
});

export default function QuizCreator({ initialQuiz = null, mode = 'create', quizId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [quiz, setQuiz] = useState(initialQuiz || buildEmptyQuiz());
  const [editingQuestion, setEditingQuestion] = useState(defaultQuestion);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canAddQuestion = useMemo(
    () =>
      editingQuestion.question.trim().length > 5 &&
      editingQuestion.options.every((option) => option.trim()),
    [editingQuestion],
  );

  const addQuestion = () => {
    if (!canAddQuestion) {
      setError('Complete the question and all options before adding.');
      return;
    }
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, editingQuestion],
    }));
    setEditingQuestion(defaultQuestion);
    setError('');
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/create');
    }
  }, [status, router]);

  useEffect(() => {
    if (initialQuiz) {
      setQuiz({
        title: initialQuiz.title || '',
        description: initialQuiz.description || '',
        questions: initialQuiz.questions || [],
      });
    } else {
      setQuiz(buildEmptyQuiz());
    }
  }, [initialQuiz]);

  const saveQuiz = async () => {
    if (!quiz.title.trim() || quiz.questions.length === 0) {
      setError('Please provide a quiz title and at least one question.');
      return;
    }
    if (!session?.user?.id) {
      setError('Please sign in to create a quiz.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const endpoint = mode === 'edit' ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const quizResponse = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quiz, createdBy: session?.user?.id }),
      });

      const quizData = await quizResponse.json();
      if (!quizData.success) {
        throw new Error(quizData.error || 'Failed to save quiz');
      }

      if (mode === 'edit') {
        router.push('/admin');
      } else {
        router.push('/admin?createdQuiz=' + quizData.quiz._id);
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-3xl p-8 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-brandBlue font-semibold">Create quiz</p>
            <h1 className="text-3xl font-black text-gray-900 mt-1">Build Your Challenge</h1>
          </div>
          <button
            className="text-brandBlue font-semibold hover:underline"
            onClick={() => router.push('/')}
          >
            Back Home
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
          <div className="lg:col-span-2 space-y-5">
            <input
              type="text"
              placeholder="Quiz Title"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brandPurple focus:ring-1 focus:ring-brandPurple"
              value={quiz.title}
              onChange={(event) => setQuiz({ ...quiz, title: event.target.value })}
            />
            <textarea
              placeholder="Description"
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brandPurple focus:ring-1 focus:ring-brandPurple min-h-[120px]"
              value={quiz.description}
              onChange={(event) => setQuiz({ ...quiz, description: event.target.value })}
            />

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Add Question</h2>
              <input
                type="text"
                placeholder="Question"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-brandPurple focus:ring-1 focus:ring-brandPurple"
                value={editingQuestion.question}
                onChange={(event) => setEditingQuestion({ ...editingQuestion, question: event.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editingQuestion.options.map((option, index) => (
                  <label
                    key={`option-${index}`}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer ${
                      editingQuestion.correctAnswer === index
                        ? 'border-brandPurple bg-brandPurple/5'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      className="text-brandPurple"
                      checked={editingQuestion.correctAnswer === index}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: index })}
                    />
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 bg-transparent outline-none"
                      value={option}
                      onChange={(event) => {
                        const nextOptions = [...editingQuestion.options];
                        nextOptions[index] = event.target.value;
                        setEditingQuestion({ ...editingQuestion, options: nextOptions });
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600">
                  Time Limit (seconds)
                  <input
                    type="number"
                    min={10}
                    max={60}
                    className="ml-3 w-24 px-3 py-2 border border-gray-200 rounded-xl"
                    value={editingQuestion.timeLimit}
                    onChange={(event) => setEditingQuestion({ ...editingQuestion, timeLimit: Number(event.target.value) })}
                  />
                </label>
                <button
                  type="button"
                  className="px-6 py-3 bg-emerald-500 text-white font-semibold rounded-2xl hover:bg-emerald-600 disabled:opacity-50"
                  onClick={addQuestion}
                  disabled={!canAddQuestion}
                >
                  Add Question
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl border border-dashed border-brandPurple text-sm text-gray-600">
              <p className="font-semibold text-brandPurple">Quiz Builder Tips</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Use 4 unique answer choices</li>
                <li>Set a clear, concise question</li>
                <li>Adjust the timer for harder questions</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-100 p-5 bg-white">
              <h3 className="font-semibold text-gray-900 mb-3">Questions ({quiz.questions.length})</h3>
              {quiz.questions.length === 0 && <p className="text-gray-500 text-sm">No questions yet. Add your first question!</p>}
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {quiz.questions.map((question, index) => (
                  <div key={`question-summary-${index}`} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/60">
                    <p className="font-semibold text-gray-800">{index + 1}. {question.question}</p>
                    <p className="text-xs text-gray-500 mt-1">Correct answer: {question.options[question.correctAnswer]}</p>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="button"
              className="w-full py-3 rounded-2xl bg-brandPurple text-white font-semibold shadow-lg shadow-brandPurple/40 hover:bg-purple-700 disabled:opacity-50"
              onClick={saveQuiz}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Quiz'}
            </button>
            {mode === 'create' && (
              <p className="text-xs text-center text-gray-500 mt-2">
                After saving, you&apos;ll be directed to your admin dashboard to launch a session.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
