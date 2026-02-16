'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ─── Answer option icons ─── */
function OptionIcon({ index, size = 20 }) {
  const icons = [
    <svg key="a" width={size} height={size} viewBox="0 0 24 24"><polygon points="12,3 22,21 2,21" fill="currentColor" /></svg>,
    <svg key="b" width={size} height={size} viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="2" transform="rotate(45 12 12)" fill="currentColor" /></svg>,
    <svg key="c" width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor" /></svg>,
    <svg key="d" width={size} height={size} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" /></svg>,
  ];
  return icons[index % 4];
}

const optionClasses = ['option-a', 'option-b', 'option-c', 'option-d'];
const labels = ['A', 'B', 'C', 'D'];

/* ─── Polling intervals (ms) — adaptive by game state ─── */
const POLL_INTERVALS = {
  waiting: 8000,     // Nothing changes fast during waiting
  active: 5000,      // Need to detect question changes
  answered: 10000,   // Already answered — just wait for next question
  finished: 0,       // Stop polling entirely
};

/* ─── Circular countdown timer ─── */
function CountdownTimer({ timeLimit, onExpired }) {
  const [remaining, setRemaining] = useState(timeLimit);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(timeLimit);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current); onExpired?.(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timeLimit, onExpired]);

  const circumference = 2 * Math.PI * 40;
  const progress = (remaining / timeLimit) * circumference;
  const urgency = remaining <= 5;
  const color = urgency ? '#ef4444' : remaining <= 10 ? '#f59e0b' : '#a78bfa';

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width="72" height="72" viewBox="0 0 90 90" className="countdown-circle">
        <circle className="countdown-track" cx="45" cy="45" r="40" />
        <circle
          className="countdown-progress"
          cx="45" cy="45" r="40"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black transition-colors ${urgency ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          {remaining}
        </span>
        <span className="text-[8px] uppercase tracking-wider text-white/40">sec</span>
      </div>
    </div>
  );
}

/* ─── Confetti effect ─── */
function Confetti() {
  const colors = ['#ff6b6b', '#4facfe', '#feca57', '#1dd1a1', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${6 + Math.random() * 8}px`,
            height: `${6 + Math.random() * 8}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function PlayerView({ gamePin, initialName = '' }) {
  const [session, setSession] = useState(null);
  const [playerName, setPlayerName] = useState(initialName);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [questionStart, setQuestionStart] = useState(null);
  const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevQuestionRef = useRef(null);
  const prevVersionRef = useRef(null);
  const pollTimerRef = useRef(null);

  /* ─── Lightweight status poll ─── 
   * Only fetches ~100 bytes { status, currentQuestion, playerCount, version }
   * If version changed → fetch full session. Otherwise skip the heavy call.
   */
  const fetchStatus = useCallback(async () => {
    if (!gamePin) return;
    try {
      const res = await fetch(`/api/games/status?pin=${gamePin}`);
      const data = await res.json();
      if (!data.success) return;

      // If nothing changed since last poll, skip full fetch
      if (data.version === prevVersionRef.current && session) return;
      prevVersionRef.current = data.version;

      // Something changed — fetch the full session
      const fullRes = await fetch(`/api/games?pin=${gamePin}`);
      const fullData = await fullRes.json();
      if (fullData.success) {
        setSession(fullData.session);
        setError('');
      }
    } catch {
      // Silent fail — will retry next poll
    }
  }, [gamePin, session]);

  /* Full session fetch (used for initial load + after mutations) */
  const fetchSession = useCallback(async () => {
    if (!gamePin) return;
    try {
      const response = await fetch(`/api/games?pin=${gamePin}`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to load game');
      setSession(data.session);
      prevVersionRef.current = Date.now(); // Reset version tracking
      setError('');
    } catch (fetchError) {
      setError(fetchError.message);
    }
  }, [gamePin]);

  /* ─── Adaptive polling ─── */
  useEffect(() => {
    // Initial full fetch
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    // Determine the right interval based on current state
    let interval;
    if (!joined) {
      interval = POLL_INTERVALS.waiting;
    } else if (session?.status === 'finished') {
      interval = POLL_INTERVALS.finished; // stop polling
    } else if (showResult || selectedAnswer !== null) {
      interval = POLL_INTERVALS.answered; // already answered this question
    } else if (session?.status === 'active') {
      interval = POLL_INTERVALS.active;
    } else {
      interval = POLL_INTERVALS.waiting;
    }

    // Clear any existing timer
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    // Set new timer (0 = don't poll)
    if (interval > 0) {
      pollTimerRef.current = setInterval(fetchStatus, interval);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [joined, session?.status, showResult, selectedAnswer, fetchStatus]);

  /* Reset selection when question changes */
  useEffect(() => {
    const currentQ = session?.currentQuestion;
    if (currentQ !== undefined && currentQ !== prevQuestionRef.current) {
      prevQuestionRef.current = currentQ;
      setSelectedAnswer(null);
      setShowResult(false);
      setLastAnswerCorrect(null);
      setQuestionStart(Date.now());
    }
  }, [session?.currentQuestion, session?.status]);

  /* Confetti on game finish */
  useEffect(() => {
    if (session?.status === 'finished' && !showConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }, [session?.status, showConfetti]);

  const playerRecord = useMemo(() => session?.players?.find((p) => p.name === playerName), [playerName, session?.players]);
  const currentQuestion = useMemo(() => {
    if (!session?.quizId?.questions?.length) return null;
    return session.quizId.questions[session.currentQuestion];
  }, [session]);
  const alreadyAnswered = useMemo(() => playerRecord?.answers?.some((e) => e.questionIndex === session?.currentQuestion), [playerRecord, session?.currentQuestion]);

  const sendJoinRequest = useCallback(async (nameToUse) => {
    if (!nameToUse.trim()) { setError('Please enter your name'); return; }
    setSubmitting(true);
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', gamePin, playerName: nameToUse.trim() }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to join game');
      setSession(data.session);
      setJoined(true);
      setError('');
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setSubmitting(false);
    }
  }, [gamePin]);

  const joinGame = async () => {
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    await sendJoinRequest(playerName);
  };

  useEffect(() => {
    if (initialName && !autoJoinAttempted) {
      setAutoJoinAttempted(true);
      setPlayerName(initialName);
      sendJoinRequest(initialName);
    }
  }, [autoJoinAttempted, initialName, sendJoinRequest]);

  const answerQuestion = async (answerIndex) => {
    if (!currentQuestion || !playerName || alreadyAnswered) return;
    setSelectedAnswer(answerIndex);
    setSubmitting(true);
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer', gamePin, playerName,
          answer: answerIndex,
          questionIndex: session.currentQuestion,
          timeSpent: questionStart ? Math.round((Date.now() - questionStart) / 1000) : 0,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to send answer');
      setSession(data.session);
      const updatedPlayer = data.session.players.find((p) => p.name === playerName);
      const lastAnswer = updatedPlayer?.answers?.find((a) => a.questionIndex === session.currentQuestion);
      setLastAnswerCorrect(lastAnswer?.correct ?? null);
      setShowResult(true);
      setError('');
    } catch (answerError) {
      setError(answerError.message);
      setSelectedAnswer(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTimerExpired = useCallback(() => {
    if (!alreadyAnswered && selectedAnswer === null) {
      setShowResult(true);
      setLastAnswerCorrect(false);
    }
  }, [alreadyAnswered, selectedAnswer]);

  /* Loading state */
  if (!session) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <div className="flex justify-center gap-2 mb-4">
            {optionClasses.map((cls, i) => (
              <div key={i} className={`${cls} w-6 h-6 rounded-md animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-white/60 text-sm">Loading game...</p>
        </div>
      </div>
    );
  }

  /* Join screen */
  if (!joined) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center p-4 safe-bottom">
        <div className="w-full max-w-md animate-scale-in">
          <div className="glass rounded-3xl p-6 sm:p-8 space-y-5 sm:space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full mb-3">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                PIN: {gamePin}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{session.quizId?.title}</h1>
              {session.quizId?.description && (
                <p className="text-white/50 text-xs sm:text-sm mt-2">{session.quizId.description}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-200 animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-wider mb-1.5 sm:mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && joinGame()}
                className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-base sm:text-lg font-medium placeholder:text-white/30 focus:ring-2 focus:ring-brandPurple/50 focus:bg-white/15 transition-all"
                placeholder="Enter your name"
                id="join-name-input"
              />
            </div>

            <button
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-base sm:text-lg font-bold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.97] transition-all disabled:opacity-40 disabled:hover:scale-100"
              onClick={joinGame}
              disabled={submitting || !playerName.trim()}
              id="join-submit-button"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Joining...
                </span>
              ) : 'Join Game'}
            </button>

            <p className="text-center text-white/30 text-[10px] sm:text-xs">
              {session.players.length} player{session.players.length !== 1 ? 's' : ''} waiting
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Game area (joined) ─── */
  return (
    <div className="min-h-screen min-h-[100dvh] bg-mesh text-white p-3 sm:p-4 md:p-6 safe-bottom">
      {showConfetti && <Confetti />}

      <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4 md:space-y-5 page-enter">
        {/* Player header bar */}
        <div className="glass rounded-2xl p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brandPurple to-brandBlue flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs sm:text-sm truncate">{playerName}</p>
              <p className="text-[10px] sm:text-xs text-white/40">PIN: {gamePin}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              {playerRecord?.score ?? 0}
            </p>
            <p className="text-[8px] sm:text-[10px] uppercase tracking-wider text-white/40">Points</p>
          </div>
        </div>

        {/* Waiting state */}
        {session.status === 'waiting' && (
          <div className="glass rounded-3xl p-8 sm:p-10 text-center space-y-4 animate-fade-in">
            <div className="flex justify-center gap-2 mb-2">
              {optionClasses.map((cls, i) => (
                <div key={i} className={`${cls} w-7 h-7 sm:w-8 sm:h-8 rounded-lg animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">You&apos;re In!</h2>
            <p className="text-white/50 text-xs sm:text-sm">Waiting for the host to start the quiz...</p>
            <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              {session.players.length} player{session.players.length !== 1 ? 's' : ''} joined
            </div>
          </div>
        )}

        {/* Active question */}
        {session.status === 'active' && currentQuestion && (
          <div className="space-y-3 sm:space-y-4 animate-scale-in">
            {/* Question header with timer */}
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-start gap-4 sm:gap-6">
              <CountdownTimer
                key={`timer-${session.currentQuestion}`}
                timeLimit={currentQuestion.timeLimit}
                onExpired={handleTimerExpired}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Question {session.currentQuestion + 1} / {session.quizId.questions.length}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl md:text-2xl font-bold leading-snug">{currentQuestion.question}</h2>
              </div>
            </div>

            {/* Answer result feedback */}
            {showResult && (
              <div className={`rounded-2xl p-4 sm:p-5 text-center animate-bounce-in ${
                lastAnswerCorrect
                  ? 'bg-emerald-500/20 border border-emerald-400/40'
                  : 'bg-red-500/20 border border-red-400/40'
              }`}>
                <p className="text-2xl sm:text-3xl mb-1">{lastAnswerCorrect ? '🎉' : '😔'}</p>
                <p className={`text-base sm:text-lg font-bold ${lastAnswerCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                  {lastAnswerCorrect ? 'Correct!' : selectedAnswer === null ? "Time's Up!" : 'Incorrect'}
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-1">
                  Score: {playerRecord?.score ?? 0} pts
                </p>
              </div>
            )}

            {/* Answer grid — full-width stacked on mobile, 2-col on tablet+ */}
            {!showResult && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 stagger-children">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={`answer-${index}`}
                    className={`${optionClasses[index]} rounded-2xl px-4 sm:px-5 py-4 sm:py-5 text-left text-white font-semibold shadow-lg hover:shadow-xl active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                      selectedAnswer === index ? 'ring-4 ring-white/50 scale-[0.97]' : ''
                    }`}
                    onClick={() => answerQuestion(index)}
                    disabled={alreadyAnswered || submitting || selectedAnswer !== null}
                    id={`answer-option-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/20 flex items-center justify-center text-sm sm:text-base font-black shrink-0">
                        {labels[index]}
                      </span>
                      <span className="text-sm sm:text-base md:text-lg leading-snug">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Finished state */}
        {session.status === 'finished' && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
            <div className="glass rounded-3xl p-6 sm:p-8 text-center space-y-4">
              <p className="text-4xl sm:text-5xl">🏆</p>
              <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Quiz Complete!
              </h2>
              <p className="text-white/50 text-xs sm:text-sm">Here&apos;s how you did</p>

              <div className="bg-white/5 rounded-2xl p-5 sm:p-6 mt-4">
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                  {playerRecord?.score ?? 0}
                </p>
                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/40 mt-1">Total Points</p>
              </div>

              {/* Mini leaderboard */}
              <div className="mt-5 sm:mt-6">
                <h3 className="text-xs sm:text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Leaderboard</h3>
                <div className="space-y-2">
                  {session.players
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 5)
                    .map((player, index) => {
                      const isMe = player.name === playerName;
                      const medals = ['🥇', '🥈', '🥉'];
                      return (
                        <div
                          key={player.name}
                          className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all ${
                            isMe ? 'bg-brandPurple/20 border border-brandPurple/30' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <span className="text-base sm:text-lg min-w-[24px] sm:min-w-[28px]">
                              {index < 3 ? medals[index] : <span className="text-xs sm:text-sm font-bold text-white/40">#{index + 1}</span>}
                            </span>
                            <span className={`font-semibold text-xs sm:text-sm truncate ${isMe ? 'text-brandPurple' : 'text-white'}`}>
                              {player.name} {isMe && '(You)'}
                            </span>
                          </div>
                          <span className="font-bold text-white/80 text-xs sm:text-sm shrink-0">{player.score}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
