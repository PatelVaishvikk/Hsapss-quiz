'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function sessionStatusColor(status) {
  if (status === 'active') return 'text-emerald-300';
  if (status === 'waiting') return 'text-amber-300';
  return 'text-slate-300';
}

export default function SessionManager({ sessions = [] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const deleteSession = async (sessionId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this session?')) {
      return;
    }
    setDeletingId(sessionId);
    setError('');
    const response = await fetch(`/api/games/${sessionId}`, { method: 'DELETE' });
    const data = await response.json();
    setDeletingId(null);
    if (!data.success) {
      setError(data.error || 'Unable to delete session');
      return;
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-white p-3 sm:p-4 md:p-6 safe-bottom">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <button className="text-xs sm:text-sm text-slate-400 p-1" onClick={() => router.push('/admin')}>
          ← Back to dashboard
        </button>
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-black">Sessions</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Manage every quiz session across all your events.</p>
        </header>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-300/40 p-2.5 sm:p-3 text-xs sm:text-sm text-red-200">{error}</div>}

        {sessions.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 p-5 sm:p-6 text-slate-400 text-xs sm:text-sm">
            No sessions yet. Launch a quiz from an event to see it here.
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">{session.quizId?.title || 'Quiz'}</p>
                  <p className="text-base sm:text-lg font-semibold">PIN {session.gamePin}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500">
                    Status:{' '}
                    <span className={sessionStatusColor(session.status)}>{session.status}</span> · Players {session.players.length}
                  </p>
                  {session.eventId && (
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Event: {session.eventId.title}</p>
                  )}
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    className="px-3 sm:px-4 py-2 rounded-full bg-brandBlue text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all"
                    onClick={() => router.push(`/host/${session.gamePin}`)}
                  >
                    Host view
                  </button>
                  <button
                    className="px-3 sm:px-4 py-2 rounded-full border border-white/30 text-xs sm:text-sm active:scale-[0.97] transition-all"
                    onClick={() => router.push(`/play/${session.gamePin}`)}
                  >
                    Player link
                  </button>
                  <button
                    className="px-3 sm:px-4 py-2 rounded-full border border-red-400 text-red-200 text-xs sm:text-sm disabled:opacity-50 active:scale-[0.97] transition-all"
                    onClick={() => deleteSession(session._id)}
                    disabled={deletingId === session._id}
                  >
                    {deletingId === session._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
