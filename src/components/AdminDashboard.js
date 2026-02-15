'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export default function AdminDashboard({ host, events = [], quizzes = [] }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', description: '', scheduledAt: '' });
  const [eventList, setEventList] = useState(events);
  const [quizList, setQuizList] = useState(quizzes);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [quizAction, setQuizAction] = useState({ deletingId: null, error: '' });
  const [eventAction, setEventAction] = useState({ deletingId: null, error: '' });

  const createEvent = async (event) => {
    event.preventDefault();
    setCreating(true); setError('');
    const response = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json();
    setCreating(false);
    if (!data.success) { setError(data.error || 'Unable to create event'); return; }
    setEventList([data.event, ...eventList]);
    setForm({ title: '', description: '', scheduledAt: '' });
  };

  const deleteQuiz = async (quizId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this quiz and its sessions?')) return;
    setQuizAction({ deletingId: quizId, error: '' });
    const response = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) { setQuizAction({ deletingId: null, error: data.error || 'Unable to delete quiz' }); return; }
    setQuizList((prev) => prev.filter((q) => q._id !== quizId));
    setQuizAction({ deletingId: null, error: '' });
  };

  const deleteEvent = async (eventId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this event and all sessions?')) return;
    setEventAction({ deletingId: eventId, error: '' });
    const response = await fetch('/api/events', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId }) });
    const data = await response.json();
    if (!data.success) { setEventAction({ deletingId: null, error: data.error || 'Unable to delete event' }); return; }
    setEventList((prev) => prev.filter((e) => e._id !== eventId));
    setEventAction({ deletingId: null, error: '' });
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-white p-3 sm:p-4 md:p-6 safe-bottom">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 md:space-y-10">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] sm:text-sm text-slate-400 uppercase tracking-wider">Welcome host</p>
            <h1 className="text-2xl sm:text-3xl font-black">{host?.name}</h1>
            <p className="text-slate-400 text-xs sm:text-sm">{host?.email}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-wrap">
            <button className="px-3 sm:px-4 py-2 rounded-full bg-brandBlue text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all" onClick={() => router.push('/create')}>
              + Create Quiz
            </button>
            <button className="px-3 sm:px-4 py-2 rounded-full border border-white/30 text-white text-xs sm:text-sm active:scale-[0.97] transition-all" onClick={() => router.push('/admin/sessions')}>
              Sessions
            </button>
            <button className="px-3 sm:px-4 py-2 rounded-full border border-white/30 text-white text-xs sm:text-sm active:scale-[0.97] transition-all" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Event + Quiz grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Plan Event */}
          <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Plan Event</h2>
            {error && <p className="text-xs sm:text-sm text-red-300 mb-2">{error}</p>}
            <form className="space-y-3 sm:space-y-4" onSubmit={createEvent}>
              <div>
                <label className="text-xs sm:text-sm text-slate-300">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-white/20 text-sm sm:text-base" required />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-slate-300">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-white/20 text-sm sm:text-base" rows={3} />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-slate-300">Scheduled Date</label>
                <input type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full mt-1 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-900 border border-white/20 text-sm sm:text-base" />
              </div>
              <button type="submit" className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-500 text-white text-sm sm:text-base font-semibold disabled:opacity-50 active:scale-[0.97] transition-all" disabled={creating}>
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Your Quizzes */}
          <div className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Your Quizzes</h2>
            {quizAction.error && <p className="text-xs sm:text-sm text-red-300 mb-2">{quizAction.error}</p>}
            {quizList.length === 0 && <p className="text-slate-400 text-xs sm:text-sm">No quizzes created yet.</p>}
            <div className="space-y-2.5 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto pr-1">
              {quizList.map((quiz) => (
                <div key={quiz._id} className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-900/50 flex flex-col gap-2">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{quiz.title}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">
                      {quiz.questions.length} questions · {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-brandBlue text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all"
                      onClick={() => router.push(`/admin/quizzes/${quiz._id}`)}>Edit</button>
                    <button className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-red-400 text-red-300 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-[0.97] transition-all"
                      onClick={() => deleteQuiz(quiz._id)} disabled={quizAction.deletingId === quiz._id}>
                      {quizAction.deletingId === quiz._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Events list */}
        <section className="bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Events ({eventList.length})</h2>
          </div>
          {eventAction.error && <p className="text-xs sm:text-sm text-red-300 mb-2">{eventAction.error}</p>}
          {eventList.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-400">Create your first event to start hosting quizzes.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {eventList.map((event) => (
                <div key={event._id} className="border border-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 bg-slate-900/40 flex flex-col gap-3">
                  <div>
                    <p className="text-base sm:text-lg font-semibold">{event.title}</p>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2">{event.description}</p>
                    {event.scheduledAt && (
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        Scheduled {new Date(event.scheduledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs uppercase text-slate-400">Sessions</p>
                        <p className="text-xl sm:text-2xl font-bold">{event.sessions?.length ?? 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] sm:text-xs uppercase text-slate-400">Players</p>
                        <p className="text-xl sm:text-2xl font-bold">
                          {(event.sessions || []).reduce((sum, s) => sum + (s.players?.length || 0), 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap ml-auto">
                      <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-brandPurple text-white text-xs sm:text-sm font-semibold active:scale-[0.97] transition-all"
                        onClick={() => router.push(`/admin/events/${event._id}`)}>Manage</button>
                      <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-red-400 text-red-200 text-xs sm:text-sm font-semibold disabled:opacity-50 active:scale-[0.97] transition-all"
                        onClick={() => deleteEvent(event._id)} disabled={eventAction.deletingId === event._id}>
                        {eventAction.deletingId === event._id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
