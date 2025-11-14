'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export default function PlayerView({ gamePin, initialName = '' }) {
  const [session, setSession] = useState(null);
  const [playerName, setPlayerName] = useState(initialName);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionStart, setQuestionStart] = useState(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!gamePin) return;
    try {
      const response = await fetch(`/api/games?pin=${gamePin}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to load game');
      }
      setSession(data.session);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message);
    }
  }, [gamePin]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  useEffect(() => {
    if (session?.status === 'active') {
      setQuestionStart(Date.now());
    }
  }, [session?.currentQuestion, session?.status]);

  const playerRecord = useMemo(() => {
    return session?.players?.find((player) => player.name === playerName);
  }, [playerName, session?.players]);

  const currentQuestion = useMemo(() => {
    if (!session?.quizId?.questions?.length) return null;
    return session.quizId.questions[session.currentQuestion];
  }, [session]);

  const sendJoinRequest = useCallback(
    async (nameToUse) => {
      if (!nameToUse.trim()) {
        setError('Please enter your name');
        return;
      }
      setSubmitting(true);
      try {
        const response = await fetch('/api/games', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'join', gamePin, playerName: nameToUse.trim() }),
        });
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Unable to join game');
        }
        setSession(data.session);
        setJoined(true);
        setError('');
      } catch (joinError) {
        setError(joinError.message);
      } finally {
        setSubmitting(false);
      }
    },
    [gamePin],
  );

  const joinGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    await sendJoinRequest(playerName);
  };

  useEffect(() => {
    if (initialName && !autoJoinAttempted) {
      setAutoJoinAttempted(true);
      setPlayerName(initialName);
      sendJoinRequest(initialName);
    }
  }, [autoJoinAttempted, initialName, sendJoinRequest]);

  const answerQuestion = async (answerIndex) => {
    if (!currentQuestion || !playerName) return;
    const alreadyAnswered = playerRecord?.answers?.some((entry) => entry.questionIndex === session.currentQuestion);
    if (alreadyAnswered) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          gamePin,
          playerName,
          answer: answerIndex,
          questionIndex: session.currentQuestion,
          timeSpent: questionStart ? Math.round((Date.now() - questionStart) / 1000) : 0,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Unable to send answer');
      }
      setSession(data.session);
      setError('');
    } catch (answerError) {
      setError(answerError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return <div className="flex min-h-screen items-center justify-center text-lg text-gray-600">Loading game...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-emerald-300">Join Game</p>
          <h1 className="text-4xl font-black">{session.quizId?.title}</h1>
          <p className="text-sm text-slate-300 mt-2">PIN: {gamePin}</p>
        </div>

        {error && <p className="text-center text-red-300 text-sm">{error}</p>}

        {!joined ? (
          <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 space-y-4">
            <p className="text-sm text-slate-300">Enter your name to join.</p>
            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="w-full px-4 py-3 rounded-2xl text-slate-900"
              placeholder="Your name"
            />
            <button
              className="w-full py-3 rounded-2xl bg-emerald-500 font-semibold"
              onClick={joinGame}
              disabled={submitting}
            >
              {submitting ? 'Joining...' : 'Join Game'}
            </button>
          </div>
        ) : (
          <>
            <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-slate-400">Player</p>
                <p className="text-3xl font-bold">{playerName}</p>
                <p className="text-sm text-slate-300">Score: {playerRecord?.score ?? 0} pts</p>
              </div>
            </div>

            {session.status === 'waiting' && (
              <div className="bg-amber-500/10 border border-amber-400/40 rounded-3xl p-6 text-center">
                Waiting for the host to start the quiz...
              </div>
            )}

            {session.status === 'active' && currentQuestion && (
              <div className="bg-slate-900/60 rounded-3xl border border-white/10 p-6 space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <p>Question {session.currentQuestion + 1} / {session.quizId.questions.length}</p>
                  <p>Time limit: {currentQuestion.timeLimit}s</p>
                </div>
                <p className="text-2xl font-semibold">{currentQuestion.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((option, index) => {
                    const answered = playerRecord?.answers?.some((entry) => entry.questionIndex === session.currentQuestion);
                    return (
                      <button
                        key={`answer-${index}`}
                        className={`rounded-2xl border border-white/10 px-4 py-3 text-left font-semibold ${
                          answered ? 'bg-slate-700/60 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'
                        }`}
                        onClick={() => answerQuestion(index)}
                        disabled={answered || submitting}
                      >
                        <span className="block text-xs text-slate-300">Option {index + 1}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {session.status === 'finished' && (
              <div className="bg-emerald-500/10 border border-emerald-400/40 rounded-3xl p-6 text-center">
                <h2 className="text-2xl font-bold text-emerald-200">Quiz Complete</h2>
                <p className="text-slate-100 mt-2">Final score: {playerRecord?.score ?? 0} pts</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
