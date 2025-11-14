'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EventDetail({ event, leaderboards = [], aggregate = [], quizzes = [] }) {
  const router = useRouter();
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [launching, setLaunching] = useState(false);
  const [status, setStatus] = useState('');
  const [sessionDeletingId, setSessionDeletingId] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const defaultQuizId = quizzes[0]?._id || '';
  const activeQuizId = selectedQuiz || defaultQuizId;
  const [recentSession, setRecentSession] = useState(null);

  const launchSession = async (eventSubmit) => {
    eventSubmit.preventDefault();
    if (!activeQuizId) return;
    setLaunching(true);
    setStatus('');
    const quizToLaunch = activeQuizId;

    const response = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: quizToLaunch, eventId: event._id }),
    });
    const data = await response.json();
    setLaunching(false);
    if (!data.success) {
      setStatus(data.error || 'Failed to launch session');
      return;
    }
    setStatus(`Session ready! PIN ${data.session.gamePin}`);
    setRecentSession({ pin: data.session.gamePin, id: data.session._id });
    router.refresh();
  };

  const deleteSession = async (sessionId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this session and leaderboard?')) {
      return;
    }
    setSessionDeletingId(sessionId);
    setSessionError('');
    const response = await fetch(`/api/games/${sessionId}`, { method: 'DELETE' });
    const data = await response.json();
    setSessionDeletingId(null);
    if (!data.success) {
      setSessionError(data.error || 'Unable to delete session');
      return;
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <button className="text-sm text-slate-400" onClick={() => router.push('/admin')}>
          ← Back to dashboard
        </button>
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col gap-4 md:flex-row md:justify-between">
          <div>
            <p className="text-xs uppercase text-slate-400 tracking-wide">Event</p>
            <h1 className="text-3xl font-black">{event.title}</h1>
            <p className="text-slate-400 mt-1 max-w-2xl">{event.description}</p>
            {event.scheduledAt && (
              <p className="text-xs text-slate-500 mt-2">
                Scheduled {new Date(event.scheduledAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs uppercase text-slate-400">Sessions</p>
              <p className="text-3xl font-bold">{leaderboards.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs uppercase text-slate-400">Players</p>
              <p className="text-3xl font-bold">
                {leaderboards.reduce((sum, board) => sum + (board.players?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
          <h2 className="text-xl font-semibold">Launch new quiz</h2>
          {status && <p className="text-sm text-emerald-300">{status}</p>}
          {recentSession && (
            <div className="border border-emerald-300/40 rounded-2xl p-4 bg-emerald-500/10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-emerald-200">Session PIN {recentSession.pin}</p>
                <p className="text-xs text-slate-200">Share this PIN with players to join.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-4 py-2 rounded-full bg-brandBlue text-white text-sm font-semibold"
                  onClick={() => router.push(`/host/${recentSession.pin}`)}
                >
                  Open host view
                </button>
                <button
                  className="px-4 py-2 rounded-full border border-white/30 text-white text-sm font-semibold"
                  onClick={() => router.push(`/play/${recentSession.pin}`)}
                >
                  Copy player link
                </button>
              </div>
            </div>
          )}
          {quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/30 p-4 text-sm text-slate-300 space-y-3">
              <p>You need at least one quiz to launch a session for this event.</p>
              <button
                className="px-4 py-2 rounded-xl bg-brandBlue text-white font-semibold"
                onClick={() => router.push('/create')}
              >
                Create a quiz
              </button>
            </div>
          ) : (
            <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={launchSession}>
              <div className="flex-1">
                <label className="text-sm text-slate-300">Select Quiz</label>
                <select
                  value={activeQuizId}
                  onChange={(event) => setSelectedQuiz(event.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-white/20 rounded-2xl px-4 py-3"
                >
                  {quizzes.map((quiz) => (
                    <option key={quiz._id} value={quiz._id}>
                      {quiz.title} ({quiz.questions.length} questions)
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-brandPurple font-semibold disabled:opacity-50"
                disabled={!activeQuizId || launching}
              >
                {launching ? 'Launching...' : 'Launch Session'}
              </button>
            </form>
          )}
        </div>

        {leaderboards.length > 0 && (
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="text-xl font-semibold">Session overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leaderboards.map((session) => (
                <div key={`overview-${session.id}`} className="border border-white/10 rounded-2xl p-4 bg-slate-900/40">
                  <p className="text-sm text-slate-400">{session.quizTitle}</p>
                  <p className="text-lg font-semibold">PIN {session.gamePin}</p>
                  <p className="text-xs uppercase tracking-wide mt-1 text-slate-500">
                    Status:{' '}
                    <span
                      className={
                        session.status === 'active'
                          ? 'text-emerald-300'
                          : session.status === 'waiting'
                            ? 'text-amber-300'
                            : 'text-slate-400'
                      }
                    >
                      {session.status}
                    </span>
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    Players joined: <span className="font-semibold">{session.players.length}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-4">Aggregate leaderboard</h2>
          {aggregate.length === 0 ? (
            <p className="text-sm text-slate-400">No results yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Rank</th>
                    <th className="py-2">Player</th>
                    <th className="py-2">Quizzes played</th>
                    <th className="py-2">Total score</th>
                    <th className="py-2">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregate.map((player, index) => (
                    <tr key={player.name} className="border-t border-white/10">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2 font-semibold">{player.name}</td>
                      <td className="py-2">{player.quizzesPlayed}</td>
                      <td className="py-2">{player.totalScore}</td>
                      <td className="py-2">{player.averageScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {sessionError && <p className="text-sm text-red-300">{sessionError}</p>}
          {leaderboards.map((session) => (
            <div key={session.id} className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-400">{session.quizTitle}</p>
                  <h3 className="text-2xl font-bold">Session PIN {session.gamePin}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Status:{' '}
                    <span
                      className={
                        session.status === 'active'
                          ? 'text-emerald-300'
                          : session.status === 'waiting'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                      }
                    >
                      {session.status}
                    </span>
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    Players joined: <span className="font-semibold">{session.players.length}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 rounded-full bg-brandBlue text-white"
                    onClick={() => router.push(`/host/${session.gamePin}`)}
                  >
                    Open host view
                  </button>
                  <button
                    className="px-4 py-2 rounded-full border border-white/30"
                    onClick={() => router.push(`/play/${session.gamePin}`)}
                  >
                    Share player link
                  </button>
                  <button
                    className="px-4 py-2 rounded-full border border-red-400 text-red-200 disabled:opacity-50"
                    onClick={() => deleteSession(session.id)}
                    disabled={sessionDeletingId === session.id}
                  >
                    {sessionDeletingId === session.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
              {session.players.length === 0 ? (
                <p className="text-sm text-slate-400">No players yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="py-2">Rank</th>
                        <th className="py-2">Player</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Answers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {session.players.map((player, index) => (
                        <tr key={player.name} className="border-t border-white/10">
                          <td className="py-2">{index + 1}</td>
                          <td className="py-2 font-semibold">{player.name}</td>
                          <td className="py-2">{player.score}</td>
                          <td className="py-2">{player.answers.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
