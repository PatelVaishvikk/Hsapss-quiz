'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);

    if (!data.success) {
      setError(data.error || 'Unable to register');
    } else {
      setSuccess('Account created! You can now sign in.');
      setTimeout(() => router.push('/login'), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wide text-brandBlue font-semibold">HSAPSS Host</p>
          <h1 className="text-3xl font-black text-gray-900 mt-2">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to host quiz events</p>
        </div>

        {error && <div className="rounded-xl bg-red-50 text-red-600 p-3 text-sm">{error}</div>}
        {success && <div className="rounded-xl bg-emerald-50 text-emerald-600 p-3 text-sm">{success}</div>}

        <form className="space-y-4" onSubmit={submit}>
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brandPurple"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brandPurple"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brandPurple"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brandPurple text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <button className="text-brandBlue font-semibold" onClick={() => router.push('/login')}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
