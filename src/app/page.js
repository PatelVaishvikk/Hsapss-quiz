'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ─── Decorative floating shapes ─── */
function FloatingShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-[10%] left-[6%] animate-float opacity-20">
        <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#a78bfa" strokeWidth="2" /></svg>
      </div>
      <div className="absolute top-[20%] right-[10%] animate-float-delay opacity-15">
        <svg width="40" height="40" viewBox="0 0 40 40"><rect x="8" y="8" width="24" height="24" rx="6" fill="none" stroke="#60a5fa" strokeWidth="2" transform="rotate(30 20 20)" /></svg>
      </div>
      <div className="absolute bottom-[25%] left-[12%] animate-float-slow opacity-15">
        <svg width="44" height="44" viewBox="0 0 44 44"><polygon points="22,4 40,40 4,40" fill="none" stroke="#f472b6" strokeWidth="2" /></svg>
      </div>
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
    </div>
  );
}

/* ─── Option label icons ─── */
function OptionIcon({ index, size = 16 }) {
  const icons = [
    <svg key="a" width={size} height={size} viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" fill="currentColor" /></svg>,
    <svg key="b" width={size} height={size} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" transform="rotate(45 12 12)" fill="currentColor" /></svg>,
    <svg key="c" width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>,
    <svg key="d" width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" /></svg>,
  ];
  return icons[index % 4];
}

export default function Home() {
  const [gamePin, setGamePin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [tapCount, setTapCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [pinFocused, setPinFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  /* Secret admin access: tap title 5 times or Ctrl+Shift+A */
  const handleTitleTap = useCallback(() => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) { setShowAdmin(true); return 0; }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        setShowAdmin((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (tapCount > 0 && tapCount < 5) {
      const timer = setTimeout(() => setTapCount(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [tapCount]);

  const joinGame = async (event) => {
    event.preventDefault();
    setError('');
    if (gamePin.trim().length !== 6) { setError('Please enter a valid 6-digit PIN'); return; }
    if (!playerName.trim()) { setError('Please enter your name'); return; }

    setJoining(true);
    try {
      const response = await fetch(`/api/games?pin=${gamePin.trim()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) { setError(data.error || 'Game not found. Check the PIN and try again.'); setJoining(false); return; }
    } catch {
      setError('Unable to connect. Please try again.'); setJoining(false); return;
    }
    router.push(`/play/${gamePin}?name=${encodeURIComponent(playerName.trim())}`);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center p-4 sm:p-6 relative overflow-hidden safe-bottom">
      <FloatingShapes />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        {/* Main Card */}
        <div className="glass-light rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brandPurple via-brandBlue to-brandTeal" />

          {/* Header */}
          <div className="text-center stagger-children">
            <div className="inline-flex items-center gap-2 bg-brandPurple/10 text-brandPurple text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-3 sm:mb-4">
              <span className="w-2 h-2 bg-brandPurple rounded-full animate-pulse" />
              Live Quiz
            </div>

            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 cursor-default select-none"
              onClick={handleTitleTap}
            >
              HSAPSS
              <span className="bg-gradient-to-r from-brandPurple to-brandBlue bg-clip-text text-transparent"> Quiz</span>
            </h1>

            <p className="text-gray-500 mt-2 sm:mt-3 text-xs sm:text-sm leading-relaxed px-2">
              Enter the game PIN to join the challenge
            </p>
          </div>

          {/* Join Form */}
          <form onSubmit={joinGame} className="space-y-3 sm:space-y-4 mt-6 sm:mt-8 stagger-children">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm animate-shake">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><circle cx="12" cy="16" r="0.5" fill="currentColor" /></svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Game PIN</label>
              <div className={`relative rounded-2xl transition-all duration-300 ${pinFocused ? 'ring-2 ring-brandPurple/40 shadow-lg shadow-brandPurple/10' : ''}`}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={gamePin}
                  onChange={(event) => setGamePin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  onFocus={() => setPinFocused(true)}
                  onBlur={() => setPinFocused(false)}
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-xl sm:text-2xl font-bold tracking-[0.3em] text-center text-gray-900 placeholder:text-gray-300 placeholder:tracking-[0.2em] placeholder:text-base sm:placeholder:text-lg placeholder:font-normal focus:bg-white transition-colors"
                  placeholder="000000"
                  maxLength={6}
                  id="game-pin-input"
                />
                {gamePin.length === 6 && (
                  <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-bounce-in">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 sm:mb-2">Your Name</label>
              <div className={`relative rounded-2xl transition-all duration-300 ${nameFocused ? 'ring-2 ring-brandPurple/40 shadow-lg shadow-brandPurple/10' : ''}`}>
                <input
                  type="text"
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base sm:text-lg font-medium text-gray-900 placeholder:text-gray-300 focus:bg-white transition-colors"
                  placeholder="Enter your name"
                  id="player-name-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={joining || gamePin.trim().length !== 6 || !playerName.trim()}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-brandPurple to-brandBlue text-white text-base sm:text-lg font-bold shadow-xl shadow-brandPurple/25 hover:shadow-2xl hover:shadow-brandPurple/30 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              id="join-game-button"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Joining...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Join Game
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              )}
            </button>
          </form>

          {/* QR hint */}
          <div className="mt-5 sm:mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium">or scan QR code</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Bottom decorative shapes */}
          <div className="flex justify-center gap-2.5 mt-5 sm:mt-6">
            {['option-a', 'option-b', 'option-c', 'option-d'].map((cls, i) => (
              <div key={i} className={`${cls} w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white shadow-md`}>
                <OptionIcon index={i} size={12} />
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-2 sm:mt-3">
            Ask your host for the 6-digit PIN
          </p>
        </div>

        {/* Hidden Admin Panel */}
        {showAdmin && (
          <div className="mt-4 glass rounded-2xl p-5 sm:p-6 space-y-4 animate-slide-down">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-white/80">Host Panel</p>
              </div>
              <button onClick={() => setShowAdmin(false)} className="text-white/40 hover:text-white/80 transition-colors p-1" aria-label="Close admin panel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <button onClick={() => router.push('/login')} className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 active:scale-[0.97] transition-all" id="host-login-button">
                🔐 Login
              </button>
              <button onClick={() => router.push('/register')} className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-semibold hover:bg-white/20 active:scale-[0.97] transition-all" id="register-button">
                📝 Register
              </button>
              <button onClick={() => router.push('/create')} className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-brandPurple/30 border border-brandPurple/30 text-white text-xs sm:text-sm font-semibold hover:bg-brandPurple/50 active:scale-[0.97] transition-all" id="create-quiz-button">
                ✨ Create Quiz
              </button>
              <button onClick={() => router.push('/admin')} className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-brandBlue/30 border border-brandBlue/30 text-white text-xs sm:text-sm font-semibold hover:bg-brandBlue/50 active:scale-[0.97] transition-all" id="admin-dashboard-button">
                ⚙️ Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Tap counter dots */}
        {tapCount > 0 && tapCount < 5 && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 animate-fade-in">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors duration-200 ${i < tapCount ? 'bg-violet-400' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
