'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server error: ${text.substring(0, 120)}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center p-4 sm:p-6 relative overflow-hidden safe-bottom">
      {/* Background orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        <div className="glass-light rounded-3xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6 relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brandPurple via-brandBlue to-brandTeal" />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-brandPurple/10 text-brandPurple text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-3">
              📝 New Host
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">Create Account</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Register to start creating quizzes</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 p-2.5 sm:p-3 text-xs sm:text-sm flex items-center gap-2 animate-shake">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" /></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 p-2.5 sm:p-3 text-xs sm:text-sm flex items-center gap-2 animate-bounce-in">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
              {success}
            </div>
          )}

          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 transition-all text-sm sm:text-base"
                placeholder="John Doe"
                required
                id="register-name"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 transition-all text-sm sm:text-base"
                placeholder="host@example.com"
                required
                id="register-email"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 transition-all text-sm sm:text-base"
                placeholder="Min 6 characters"
                required
                id="register-password"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 transition-all text-sm sm:text-base"
                placeholder="Re-enter password"
                required
                id="register-confirm-password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-brandPurple to-violet-500 text-white text-base sm:text-lg font-bold shadow-xl shadow-brandPurple/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-40 disabled:hover:scale-100"
              disabled={loading}
              id="register-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] sm:text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="flex gap-2.5 sm:gap-3">
            <button
              className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 active:scale-[0.97] transition-all"
              onClick={() => router.push('/login')}
            >
              Sign In
            </button>
            <button
              className="flex-1 py-2.5 sm:py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold hover:bg-gray-100 active:scale-[0.97] transition-all"
              onClick={() => router.push('/')}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
