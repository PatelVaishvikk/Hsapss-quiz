'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const labels = ['A', 'B', 'C', 'D'];
const optionSoftClasses = ['option-a-soft', 'option-b-soft', 'option-c-soft', 'option-d-soft'];
const optionActiveClasses = ['option-a-active', 'option-b-active', 'option-c-active', 'option-d-active'];
const optionClasses = ['option-a', 'option-b', 'option-c', 'option-d'];

const defaultQuestion = { question: '', options: ['', '', '', ''], correctAnswer: 0, timeLimit: 20 };
const buildEmptyQuiz = () => ({ title: '', description: '', questions: [] });

export default function QuizCreator({ initialQuiz = null, mode = 'create', quizId }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [quiz, setQuiz] = useState(initialQuiz || buildEmptyQuiz());
  const [editingQuestion, setEditingQuestion] = useState(defaultQuestion);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const canAddQuestion = useMemo(() =>
    editingQuestion.question.trim().length > 5 && editingQuestion.options.every((o) => o.trim()),
    [editingQuestion],
  );

  const addQuestion = () => {
    if (!canAddQuestion) { setError('Complete the question and all options.'); return; }
    if (editingIndex !== null) {
      setQuiz((prev) => { const u = [...prev.questions]; u[editingIndex] = editingQuestion; return { ...prev, questions: u }; });
      setEditingIndex(null);
    } else {
      setQuiz((prev) => ({ ...prev, questions: [...prev.questions, editingQuestion] }));
    }
    setEditingQuestion(defaultQuestion);
    setError('');
  };

  const editQuestion = (i) => { setEditingQuestion(quiz.questions[i]); setEditingIndex(i); };
  const deleteQuestion = (i) => {
    setQuiz((prev) => ({ ...prev, questions: prev.questions.filter((_, j) => j !== i) }));
    if (editingIndex === i) { setEditingQuestion(defaultQuestion); setEditingIndex(null); }
  };
  const cancelEdit = () => { setEditingQuestion(defaultQuestion); setEditingIndex(null); };

  useEffect(() => { if (status === 'unauthenticated') router.push('/login?redirect=/create'); }, [status, router]);
  useEffect(() => {
    if (initialQuiz) setQuiz({ title: initialQuiz.title || '', description: initialQuiz.description || '', questions: initialQuiz.questions || [] });
    else setQuiz(buildEmptyQuiz());
  }, [initialQuiz]);

  const saveQuiz = async () => {
    if (!quiz.title.trim() || quiz.questions.length === 0) { setError('Provide a title and at least one question.'); return; }
    if (!session?.user?.id) { setError('Please sign in to create a quiz.'); return; }
    setIsSaving(true); setError('');
    try {
      const endpoint = mode === 'edit' ? `/api/quizzes/${quizId}` : '/api/quizzes';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...quiz, createdBy: session?.user?.id }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save quiz');
      router.push(mode === 'edit' ? '/admin' : '/admin?createdQuiz=' + data.quiz._id);
    } catch (saveError) { setError(saveError.message); } finally { setIsSaving(false); }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-mesh py-4 sm:py-6 md:py-8 px-3 sm:px-4 page-enter safe-bottom">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-2">
              ✨ Quiz Builder
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {mode === 'edit' ? 'Edit Quiz' : 'Build Your Challenge'}
            </h1>
          </div>
          <button
            className="text-white/50 hover:text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1 p-2"
            onClick={() => router.push(mode === 'edit' ? '/admin' : '/')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Quiz info */}
            <div className="glass rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="Quiz Title"
                className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg sm:text-xl font-bold placeholder:text-white/30 focus:ring-2 focus:ring-brandPurple/50 focus:bg-white/15 transition-all"
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                id="quiz-title"
              />
              <textarea
                placeholder="Description (optional)"
                className="w-full px-4 sm:px-5 py-3 rounded-2xl bg-white/10 border border-white/20 text-white text-sm sm:text-base placeholder:text-white/30 focus:ring-2 focus:ring-brandPurple/50 focus:bg-white/15 transition-all min-h-[60px] sm:min-h-[80px] resize-none"
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                id="quiz-description"
              />
            </div>

            {/* Question editor */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {editingIndex !== null ? `Editing Q${editingIndex + 1}` : 'Add Question'}
                </h2>
                {editingIndex !== null && (
                  <button onClick={cancelEdit} className="text-[10px] sm:text-xs text-white/40 hover:text-white/70 transition-colors p-1">Cancel</button>
                )}
              </div>

              <input
                type="text"
                placeholder="Type your question here..."
                className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-base sm:text-lg font-medium placeholder:text-white/30 focus:ring-2 focus:ring-brandPurple/50 transition-all"
                value={editingQuestion.question}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                id="question-input"
              />

              {/* Option inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {editingQuestion.options.map((option, index) => (
                  <label
                    key={`option-${index}`}
                    className={`flex items-center gap-2.5 sm:gap-3 rounded-2xl border-2 px-3 sm:px-4 py-3 sm:py-3.5 cursor-pointer transition-all ${
                      editingQuestion.correctAnswer === index ? optionActiveClasses[index] : optionSoftClasses[index]
                    }`}
                  >
                    <input type="radio" name="correctAnswer" className="sr-only" checked={editingQuestion.correctAnswer === index}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: index })} />
                    <div className={`${optionClasses[index]} w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-black shrink-0`}>
                      {labels[index]}
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${labels[index]}`}
                      className="flex-1 bg-transparent outline-none text-white text-sm sm:text-base placeholder:text-white/30 min-w-0"
                      value={option}
                      onChange={(e) => {
                        const next = [...editingQuestion.options];
                        next[index] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: next });
                      }}
                    />
                    {editingQuestion.correctAnswer === index && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </label>
                ))}
              </div>
              <p className="text-[10px] sm:text-xs text-white/30">Tap the option to mark it as correct</p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 sm:pt-2">
                <label className="text-xs sm:text-sm text-white/50 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  Timer
                  <input
                    type="number" min={10} max={60}
                    className="w-16 sm:w-20 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-white text-center text-sm"
                    value={editingQuestion.timeLimit}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, timeLimit: Number(e.target.value) })}
                  />
                  <span className="text-white/30">sec</span>
                </label>
                <button
                  type="button"
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-all disabled:opacity-40 text-sm sm:text-base"
                  onClick={addQuestion}
                  disabled={!canAddQuestion}
                  id="add-question-button"
                >
                  {editingIndex !== null ? '✓ Update' : '+ Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-3 sm:space-y-4">
            {/* Tips — hidden on mobile to save space */}
            <div className="glass rounded-2xl p-4 sm:p-5 space-y-3 hidden sm:block">
              <p className="font-semibold text-white/70 text-xs sm:text-sm flex items-center gap-2">
                <span className="text-brandPurple">💡</span> Tips
              </p>
              <ul className="text-[10px] sm:text-xs text-white/40 space-y-2 pl-1">
                <li className="flex items-start gap-2"><span className="text-brandPurple mt-0.5">•</span> Use 4 unique answer choices</li>
                <li className="flex items-start gap-2"><span className="text-brandPurple mt-0.5">•</span> Set a clear, concise question</li>
                <li className="flex items-start gap-2"><span className="text-brandPurple mt-0.5">•</span> Adjust timer for harder questions</li>
                <li className="flex items-start gap-2"><span className="text-brandPurple mt-0.5">•</span> Tap a question to edit it</li>
              </ul>
            </div>

            {/* Question list */}
            <div className="glass rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                <h3 className="font-bold text-white text-xs sm:text-sm">Questions</h3>
                <span className="text-xs sm:text-sm font-semibold text-brandPurple bg-brandPurple/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                  {quiz.questions.length}
                </span>
              </div>
              {quiz.questions.length === 0 && (
                <p className="text-white/30 text-xs sm:text-sm py-3 sm:py-4 text-center">No questions yet</p>
              )}
              <div className="space-y-1.5 sm:space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                {quiz.questions.map((question, index) => (
                  <div
                    key={`question-summary-${index}`}
                    className={`rounded-xl p-2.5 sm:p-3 bg-white/5 border transition-all group hover:bg-white/10 ${
                      editingIndex === index ? 'border-brandPurple/50 bg-brandPurple/10' : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-xs sm:text-sm truncate">
                          {index + 1}. {question.question}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-white/30 mt-0.5 sm:mt-1 truncate">
                          ✓ {question.options[question.correctAnswer]}
                        </p>
                      </div>
                      <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editQuestion(index)} className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all" title="Edit">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => deleteQuestion(index)} className="p-1 sm:p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-300 transition-all" title="Delete">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-200 animate-shake">
                {error}
              </div>
            )}

            <button
              type="button"
              className="w-full py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-brandPurple to-violet-500 text-white font-bold text-base sm:text-lg shadow-xl shadow-brandPurple/25 active:scale-[0.97] transition-all disabled:opacity-40"
              onClick={saveQuiz}
              disabled={isSaving}
              id="save-quiz-button"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Saving...
                </span>
              ) : mode === 'edit' ? 'Save Changes' : 'Save Quiz'}
            </button>
            {mode === 'create' && (
              <p className="text-[10px] sm:text-xs text-center text-white/30">
                After saving, head to your dashboard to launch a session.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
