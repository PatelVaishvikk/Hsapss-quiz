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
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <button className="text-sm text-slate-400" onClick={() => router.push('/admin')}>
          ← Back to dashboard
        </button>
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-black">Sessions</h1>
          <p className="text-slate-400 text-sm">Manage every quiz session across all your events.</p>
        </header>

        {error && <div className="rounded-xl bg-red-500/10 border border-red-300/40 p-3 text-sm text-red-200">{error}</div>}

        {sessions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 p-6 text-slate-400">
            No sessions yet. Launch a quiz from an event to see it here.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-400">{session.quizId?.title || 'Quiz'}</p>
                  <p className="text-lg font-semibold">PIN {session.gamePin}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Status:{' '}
                    <span className={sessionStatusColor(session.status)}>{session.status}</span> · Players {session.players.length}
                  </p>
                  {session.eventId && (
                    <p className="text-xs text-slate-500 mt-1">Event: {session.eventId.title}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="px-4 py-2 rounded-full bg-brandBlue text-white font-semibold"
                    onClick={() => router.push(`/host/${session.gamePin}`)}
                  >
                    Host view
                  </button>
                  <button
                    className="px-4 py-2 rounded-full border border-white/30"
                    onClick={() => router.push(`/play/${session.gamePin}`)}
                  >
                    Player link
                  </button>
                  <button
                    className="px-4 py-2 rounded-full border border-red-400 text-red-200 disabled:opacity-50"
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
