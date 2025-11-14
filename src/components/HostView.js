'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export default function HostView({ gamePin }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSession = useCallback(async () => {
    if (!gamePin) return;
    try {
      const response = await fetch(`/api/games?pin=${gamePin}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch session');
      }
      setSession(data.session);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [gamePin]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleAction = async (action) => {
    if (!gamePin) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, gamePin }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Unable to update game');
      }
      setSession(data.session);
      setError('');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const currentQuestion = useMemo(() => {
    if (!session?.quizId?.questions?.length) return null;
    return session.quizId.questions[session.currentQuestion];
  }, [session]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-gray-600">Preparing your quiz...</div>;
  }

  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-red-600">Unable to load the requested game.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-violet-300">Host Dashboard</p>
            <h1 className="text-4xl font-black text-white">{session.quizId?.title}</h1>
            <p className="text-sm text-violet-200 mt-1">{session.quizId?.description}</p>
          </div>
          <div className="bg-white text-slate-900 px-6 py-4 rounded-3xl shadow-2xl text-center border-4 border-violet-500">
            <p className="text-xs font-semibold text-gray-500 uppercase">Game PIN</p>
            <p className="text-3xl font-black tracking-widest">{gamePin}</p>
            <button
              className="text-xs font-semibold text-violet-600 mt-2 hover:underline"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(gamePin);
                }
              }}
            >
              Copy PIN
            </button>
          </div>
        </div>

        {error && <p className="text-red-300">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <p className="text-2xl font-bold capitalize">{session.status}</p>
              </div>
              <div className="flex gap-3">
                {session.status === 'waiting' && (
                  <button
                    className="px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold disabled:opacity-50"
                    onClick={() => handleAction('start')}
                    disabled={actionLoading || session.players.length === 0}
                  >
                    Start Game
                  </button>
                )}
                {session.status === 'active' && (
                  <button
                    className="px-4 py-2 rounded-full bg-violet-500 text-white font-semibold disabled:opacity-50"
                    onClick={() => handleAction('advance')}
                    disabled={actionLoading}
                  >
                    Next Question
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-full border border-white/40 text-white font-semibold disabled:opacity-50"
                  onClick={() => handleAction('reset')}
                  disabled={actionLoading}
                >
                  Reset
                </button>
              </div>
            </div>

            {currentQuestion ? (
              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">Question {session.currentQuestion + 1} of {session.quizId.questions.length}</p>
                  <p className="text-sm text-slate-300">Time limit: {currentQuestion.timeLimit}s</p>
                </div>
                <p className="text-2xl font-semibold">{currentQuestion.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options.map((option, index) => (
                    <div
                      key={`option-${index}`}
                      className={`rounded-2xl border border-white/10 px-4 py-3 ${
                        session.status === 'finished' && index === currentQuestion.correctAnswer ? 'bg-emerald-500/20 border-emerald-400/40' : 'bg-white/5'
                      }`}
                    >
                      <p className="text-sm text-slate-300">Option {index + 1}</p>
                      <p className="font-semibold">{option}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-2xl p-6 text-slate-300">Waiting for questions to load...</div>
            )}
          </div>

          <div className="bg-white text-slate-900 rounded-3xl p-6 border border-violet-100">
            <h2 className="text-2xl font-bold mb-4">Players ({session.players.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {session.players.map((player) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 border border-slate-200"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{player.name}</p>
                    <p className="text-xs text-slate-500">{player.answers.length} answers</p>
                  </div>
                  <p className="text-lg font-black text-violet-600">{player.score}</p>
                </div>
              ))}
              {session.players.length === 0 && <p className="text-slate-500 text-sm">Share the PIN so players can join.</p>}
            </div>
          </div>
        </div>

        {session.status === 'finished' && (
          <div className="bg-emerald-500/10 border border-emerald-300/40 rounded-3xl p-6">
            <h3 className="text-2xl font-bold text-emerald-200">Game Finished!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {session.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={`winner-${player.name}`} className="bg-white/10 rounded-2xl p-4 border border-white/20">
                    <p className="text-sm text-slate-200 uppercase tracking-wide">#{index + 1}</p>
                    <p className="text-xl font-bold text-white">{player.name}</p>
                    <p className="text-2xl font-black text-emerald-300 mt-2">{player.score} pts</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
