'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GameQRCode from './GameQRCode';

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

  const launchSession = async (e) => {
    e.preventDefault();
    if (!activeQuizId) return;
    setLaunching(true); setStatus('');
    const response = await fetch('/api/games', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizId: activeQuizId, eventId: event._id }),
    });
    const data = await response.json();
    setLaunching(false);
    if (!data.success) { setStatus(data.error || 'Failed to launch session'); return; }
    setStatus(`Session ready! PIN ${data.session.gamePin}`);
    setRecentSession({ pin: data.session.gamePin, id: data.session._id });
    router.refresh();
  };

  const deleteSession = async (sessionId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this session and leaderboard?')) return;
    setSessionDeletingId(sessionId); setSessionError('');
    const response = await fetch(`/api/games/${sessionId}`, { method: 'DELETE' });
    const data = await response.json();
    setSessionDeletingId(null);
    if (!data.success) { setSessionError(data.error || 'Unable to delete session'); return; }
    router.refresh();
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-white p-3 sm:p-4 md:p-6 safe-bottom">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
        <button className="text-xs sm:text-sm text-slate-400 p-1" onClick={() => router.push('/admin')}>
          ← Back to dashboard
        </button>

        {/* Event header */}
        <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 flex flex-col gap-3 sm:gap-4 md:flex-row md:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs uppercase text-slate-400 tracking-wide">Event</p>
            <h1 className="text-2xl sm:text-3xl font-black truncate">{event.title}</h1>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm line-clamp-2">{event.description}</p>
            {event.scheduledAt && (
              <p className="text-[10px] sm:text-xs text-slate-500 mt-2">
                Scheduled {new Date(event.scheduledAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex gap-4 sm:gap-6 shrink-0">
            <div className="text-center">
              <p className="text-[10px] sm:text-xs uppercase text-slate-400">Sessions</p>
              <p className="text-2xl sm:text-3xl font-bold">{leaderboards.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] sm:text-xs uppercase text-slate-400">Players</p>
              <p className="text-2xl sm:text-3xl font-bold">
                {leaderboards.reduce((sum, b) => sum + (b.players?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Launch new quiz */}
        <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold">Launch new quiz</h2>
          {status && <p className="text-xs sm:text-sm text-emerald-300">{status}</p>}

          {recentSession && (
            <div className="border border-emerald-300/40 rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-emerald-500/10 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 sm:gap-5">
                <GameQRCode gamePin={recentSession.pin} variant="compact" showPin={false} />
                <div>
                  <p className="text-base sm:text-lg font-bold text-emerald-200">PIN: {recentSession.pin}</p>
                  <p className="text-[10px] sm:text-xs text-slate-200 mt-1">Share this PIN or scan the QR code to join.</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brandBlue text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all"
                  onClick={() => router.push(`/host/${recentSession.pin}`)}>Host view</button>
                <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all"
                  onClick={() => { const url = `${window.location.origin}/play/${recentSession.pin}`; if (navigator.clipboard) navigator.clipboard.writeText(url); }}>
                  Copy link
                </button>
              </div>
            </div>
          )}

          {quizzes.length === 0 ? (
            <div className="rounded-xl sm:rounded-2xl border border-dashed border-white/30 p-3 sm:p-4 text-xs sm:text-sm text-slate-300 space-y-2 sm:space-y-3">
              <p>You need at least one quiz to launch a session.</p>
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-brandBlue text-white font-semibold text-xs sm:text-sm"
                onClick={() => router.push('/create')}>Create a quiz</button>
            </div>
          ) : (
            <form className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end" onSubmit={launchSession}>
              <div className="flex-1">
                <label className="text-xs sm:text-sm text-slate-300">Select Quiz</label>
                <select value={activeQuizId} onChange={(e) => setSelectedQuiz(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-white/20 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base">
                  {quizzes.map((q) => (
                    <option key={q._id} value={q._id}>{q.title} ({q.questions.length} questions)</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-brandPurple font-semibold text-sm sm:text-base disabled:opacity-50 active:scale-[0.97] transition-all"
                disabled={!activeQuizId || launching}>
                {launching ? 'Launching...' : 'Launch Session'}
              </button>
            </form>
          )}
        </div>

        {/* Session overview */}
        {leaderboards.length > 0 && (
          <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10 space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-semibold">Session overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {leaderboards.map((s) => (
                <div key={`overview-${s.id}`} className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-900/40">
                  <p className="text-xs sm:text-sm text-slate-400">{s.quizTitle}</p>
                  <p className="text-base sm:text-lg font-semibold">PIN {s.gamePin}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide mt-1 text-slate-500">
                    Status: <span className={s.status === 'active' ? 'text-emerald-300' : s.status === 'waiting' ? 'text-amber-300' : 'text-slate-400'}>{s.status}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">Players: <span className="font-semibold">{s.players.length}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aggregate leaderboard */}
        <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Aggregate leaderboard</h2>
          {aggregate.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-400">No results yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-left text-xs sm:text-sm min-w-[400px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className="py-2">Rank</th>
                    <th className="py-2">Player</th>
                    <th className="py-2">Played</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregate.map((p, i) => (
                    <tr key={p.name} className="border-t border-white/10">
                      <td className="py-2">{i + 1}</td>
                      <td className="py-2 font-semibold">{p.name}</td>
                      <td className="py-2">{p.quizzesPlayed}</td>
                      <td className="py-2">{p.totalScore}</td>
                      <td className="py-2">{p.averageScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Session leaderboards */}
        <div className="space-y-4 sm:space-y-6">
          {sessionError && <p className="text-xs sm:text-sm text-red-300">{sessionError}</p>}
          {leaderboards.map((s) => (
            <div key={s.id} className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
              <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between mb-3 sm:mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">{s.quizTitle}</p>
                  <h3 className="text-lg sm:text-2xl font-bold">Session PIN {s.gamePin}</h3>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500">
                    Status: <span className={s.status === 'active' ? 'text-emerald-300' : s.status === 'waiting' ? 'text-amber-300' : 'text-slate-300'}>{s.status}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">Players: <span className="font-semibold">{s.players.length}</span></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brandBlue text-white text-xs sm:text-sm active:scale-[0.97] transition-all"
                    onClick={() => router.push(`/host/${s.gamePin}`)}>Host view</button>
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/30 text-xs sm:text-sm active:scale-[0.97] transition-all"
                    onClick={() => router.push(`/play/${s.gamePin}`)}>Player link</button>
                  <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-400 text-red-200 text-xs sm:text-sm disabled:opacity-50 active:scale-[0.97] transition-all"
                    onClick={() => deleteSession(s.id)} disabled={sessionDeletingId === s.id}>
                    {sessionDeletingId === s.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
              {s.players.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-400">No players yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-left text-xs sm:text-sm min-w-[300px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="py-2">Rank</th>
                        <th className="py-2">Player</th>
                        <th className="py-2">Score</th>
                        <th className="py-2">Answers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.players.map((p, i) => (
                        <tr key={p.name} className="border-t border-white/10">
                          <td className="py-2">{i + 1}</td>
                          <td className="py-2 font-semibold">{p.name}</td>
                          <td className="py-2">{p.score}</td>
                          <td className="py-2">{p.answers.length}</td>
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
