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
    setCreating(true);
    setError('');
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setCreating(false);
    if (!data.success) {
      setError(data.error || 'Unable to create event');
      return;
    }
    setEventList([data.event, ...eventList]);
    setForm({ title: '', description: '', scheduledAt: '' });
  };

  const deleteQuiz = async (quizId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this quiz and its sessions?')) {
      return;
    }
    setQuizAction({ deletingId: quizId, error: '' });
    const response = await fetch(`/api/quizzes/${quizId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!data.success) {
      setQuizAction({ deletingId: null, error: data.error || 'Unable to delete quiz' });
      return;
    }
    setQuizList((prev) => prev.filter((quiz) => quiz._id !== quizId));
    setQuizAction({ deletingId: null, error: '' });
  };

  const deleteEvent = async (eventId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this event and all sessions?')) {
      return;
    }
    setEventAction({ deletingId: eventId, error: '' });
    const response = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    });
    const data = await response.json();
    if (!data.success) {
      setEventAction({ deletingId: null, error: data.error || 'Unable to delete event' });
      return;
    }
    setEventList((prev) => prev.filter((event) => event._id !== eventId));
    setEventAction({ deletingId: null, error: '' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400 uppercase">Welcome host</p>
            <h1 className="text-3xl font-black">{host?.name}</h1>
            <p className="text-slate-400 text-sm">{host?.email}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              className="px-4 py-2 rounded-full bg-brandBlue text-white font-semibold"
              onClick={() => router.push('/create')}
            >
              Create Quiz
            </button>
            <button
              className="px-4 py-2 rounded-full border border-white/30 text-white"
              onClick={() => router.push('/admin/sessions')}
            >
              Sessions
            </button>
            <button
              className="px-4 py-2 rounded-full border border-white/30 text-white"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Sign Out
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Plan Event</h2>
            {error && <p className="text-sm text-red-300 mb-2">{error}</p>}
            <form className="space-y-4" onSubmit={createEvent}>
              <div>
                <label className="text-sm text-slate-300">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="w-full mt-1 rounded-2xl px-4 py-3 bg-slate-900 border border-white/20"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  className="w-full mt-1 rounded-2xl px-4 py-3 bg-slate-900 border border-white/20"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">Scheduled Date</label>
                <input
                  type="date"
                  value={form.scheduledAt}
                  onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                  className="w-full mt-1 rounded-2xl px-4 py-3 bg-slate-900 border border-white/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-semibold disabled:opacity-50"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Event'}
              </button>
            </form>
          </div>
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Your Quizzes</h2>
            {quizAction.error && <p className="text-sm text-red-300 mb-2">{quizAction.error}</p>}
            {quizList.length === 0 && <p className="text-slate-400 text-sm">No quizzes created yet.</p>}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {quizList.map((quiz) => (
                <div key={quiz._id} className="border border-white/10 rounded-2xl p-4 bg-slate-900/50 flex flex-col gap-2">
                  <div>
                    <p className="font-semibold">{quiz.title}</p>
                    <p className="text-xs text-slate-400">
                      {quiz.questions.length} questions · {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-2 rounded-xl bg-brandBlue text-white text-sm font-semibold"
                      onClick={() => router.push(`/admin/quizzes/${quiz._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="flex-1 px-3 py-2 rounded-xl border border-red-400 text-red-300 text-sm font-semibold disabled:opacity-50"
                      onClick={() => deleteQuiz(quiz._id)}
                      disabled={quizAction.deletingId === quiz._id}
                    >
                      {quizAction.deletingId === quiz._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/5 rounded-3xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Events ({eventList.length})</h2>
          </div>
          {eventAction.error && <p className="text-sm text-red-300 mb-2">{eventAction.error}</p>}
          {eventList.length === 0 ? (
            <p className="text-sm text-slate-400">Create your first event to start hosting quizzes.</p>
          ) : (
            <div className="space-y-4">
              {eventList.map((event) => (
                <div key={event._id} className="border border-white/10 rounded-2xl p-4 bg-slate-900/40 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{event.title}</p>
                    <p className="text-sm text-slate-400">{event.description}</p>
                    {event.scheduledAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        Scheduled {new Date(event.scheduledAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs uppercase text-slate-400">Sessions</p>
                      <p className="text-2xl font-bold">{event.sessions?.length ?? 0}</p>
                      <p className="text-xs text-slate-500">
                        Live: {(event.sessions || []).filter((session) => session.status === 'active').length}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs uppercase text-slate-400">Players joined</p>
                      <p className="text-2xl font-bold">
                        {(event.sessions || []).reduce((sum, session) => sum + (session.players?.length || 0), 0)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded-full bg-brandPurple text-white font-semibold"
                        onClick={() => router.push(`/admin/events/${event._id}`)}
                      >
                        Manage
                      </button>
                      <button
                        className="px-4 py-2 rounded-full border border-red-400 text-red-200 font-semibold disabled:opacity-50"
                        onClick={() => deleteEvent(event._id)}
                        disabled={eventAction.deletingId === event._id}
                      >
                        {eventAction.deletingId === event._id ? 'Deleting...' : 'Delete'}
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
