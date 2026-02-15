'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
    } else {
      router.push('/admin');
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
              🔐 Host Access
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">Sign In</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-2">Access your quiz dashboard</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 p-2.5 sm:p-3 text-xs sm:text-sm flex items-center gap-2 animate-shake">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" /></svg>
              {error}
            </div>
          )}

          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 focus:border-brandPurple transition-all text-sm sm:text-base"
                placeholder="host@example.com"
                required
                id="login-email"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-brandPurple/40 focus:border-brandPurple transition-all text-sm sm:text-base"
                placeholder="••••••••"
                required
                id="login-password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-brandPurple to-violet-500 text-white text-base sm:text-lg font-bold shadow-xl shadow-brandPurple/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-40 disabled:hover:scale-100"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
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
              onClick={() => router.push('/register')}
            >
              Create Account
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
