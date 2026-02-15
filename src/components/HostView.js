'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import GameQRCode from './GameQRCode';

const optionClasses = ['option-a', 'option-b', 'option-c', 'option-d'];
const labels = ['A', 'B', 'C', 'D'];

export default function HostView({ gamePin }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!gamePin) return;
    try {
      const response = await fetch(`/api/games?pin=${gamePin}&role=host`, { cache: 'no-store' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch session');
      setSession(data.session);
      setError('');
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [gamePin]);

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const handleAction = async (action) => {
    if (!gamePin) return;
    setActionLoading(true);
    try {
      const response = await fetch('/api/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, gamePin }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Unable to update game');
      setSession(data.session);
      setError('');
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setActionLoading(false);
    }
  };

  const copyPin = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(gamePin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const currentQuestion = useMemo(() => {
    if (!session?.quizId?.questions?.length) return null;
    return session.quizId.questions[session.currentQuestion];
  }, [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return session.players.filter((p) => p.answers.some((a) => a.questionIndex === session.currentQuestion)).length;
  }, [session]);

  const sortedPlayers = useMemo(() => {
    if (!session) return [];
    return session.players.slice().sort((a, b) => b.score - a.score);
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="flex justify-center gap-2 mb-4">
            {optionClasses.map((cls, i) => (
              <div key={i} className={`${cls} w-6 h-6 rounded-md animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          <p className="text-white/60 text-sm">Preparing your quiz...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-mesh flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 sm:p-8 text-center max-w-md">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-lg font-bold text-white">Unable to load the game</p>
          <p className="text-white/50 text-sm mt-2">Check the PIN and try again</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    waiting: { label: 'Waiting for players', color: 'text-amber-300', bg: 'bg-amber-500/10', dot: 'bg-amber-400' },
    active: { label: 'Game in progress', color: 'text-emerald-300', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
    finished: { label: 'Game finished', color: 'text-violet-300', bg: 'bg-violet-500/10', dot: 'bg-violet-400' },
  };
  const statusInfo = statusConfig[session.status] || statusConfig.waiting;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-mesh text-white p-3 sm:p-4 md:p-8 page-enter safe-bottom">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Top header bar */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className={`inline-flex items-center gap-2 ${statusInfo.bg} ${statusInfo.color} text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full mb-2`}>
              <span className={`w-2 h-2 ${statusInfo.dot} rounded-full animate-pulse`} />
              {statusInfo.label}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white truncate">{session.quizId?.title}</h1>
            {session.quizId?.description && (
              <p className="text-xs sm:text-sm text-white/40 mt-1 line-clamp-2">{session.quizId.description}</p>
            )}
          </div>

          {/* PIN + QR display */}
          <div className="glass rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-center flex flex-row md:flex-col items-center md:items-center gap-3 sm:gap-4 shrink-0">
            <GameQRCode gamePin={gamePin} variant="compact" showPin={true} />
            <button
              className="text-xs font-semibold text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
              onClick={copyPin}
            >
              {copiedPin ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
              ) : (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg> Copy PIN</>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-200 animate-shake">
            {error}
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Question area (2 columns) */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {/* Action bar */}
            <div className="glass rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-white/50">
                  {session.status === 'active'
                    ? `Q${session.currentQuestion + 1}/${session.quizId.questions.length}`
                    : `${session.players.length} player${session.players.length !== 1 ? 's' : ''}`}
                </span>
                {session.status === 'active' && (
                  <span className="text-[10px] sm:text-xs text-white/30">
                    {answeredCount}/{session.players.length} answered
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {session.status === 'waiting' && (
                  <button
                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-40"
                    onClick={() => handleAction('start')}
                    disabled={actionLoading || session.players.length === 0}
                    id="start-game-button"
                  >
                    ▶ Start
                  </button>
                )}
                {session.status === 'active' && (
                  <button
                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-brandPurple to-violet-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brandPurple/20 hover:shadow-xl active:scale-[0.97] transition-all disabled:opacity-40"
                    onClick={() => handleAction('advance')}
                    disabled={actionLoading}
                    id="next-question-button"
                  >
                    Next →
                  </button>
                )}
                <button
                  className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs sm:text-sm font-semibold hover:bg-white/10 active:scale-[0.97] transition-all disabled:opacity-40"
                  onClick={() => handleAction('reset')}
                  disabled={actionLoading}
                  id="reset-game-button"
                >
                  ↻ Reset
                </button>
              </div>
            </div>

            {/* Waiting room — large QR for projecting */}
            {session.status === 'waiting' && (
              <div className="glass rounded-3xl p-6 sm:p-8 md:p-12 flex flex-col items-center gap-4 sm:gap-6 animate-scale-in">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white text-center">
                  Scan to Join!
                </h2>
                <GameQRCode gamePin={gamePin} variant="large" showPin={true} />
                <div className="flex items-center gap-2 text-white/30 text-xs sm:text-sm text-center">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shrink-0" />
                  {session.players.length === 0
                    ? 'Waiting for players to join...'
                    : `${session.players.length} player${session.players.length !== 1 ? 's' : ''} joined — press Start when ready`}
                </div>
              </div>
            )}

            {/* Question card */}
            {currentQuestion ? (
              <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 sm:space-y-5 animate-fade-in">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-white/40">
                    Question {session.currentQuestion + 1} of {session.quizId.questions.length}
                  </span>
                  <span className="text-white/30 flex items-center gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {currentQuestion.timeLimit}s
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl md:text-3xl font-bold leading-snug">{currentQuestion.question}</h2>

                {/* Answer options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correctAnswer;
                    return (
                      <div
                        key={`option-${index}`}
                        className={`${optionClasses[index]} rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3 transition-all ${
                          session.status === 'finished' && isCorrect ? 'ring-4 ring-white/50 scale-[1.02]' : ''
                        }`}
                      >
                        <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 flex items-center justify-center text-xs sm:text-sm font-black shrink-0">
                          {labels[index]}
                        </span>
                        <span className="font-semibold text-sm sm:text-base">{option}</span>
                        {session.status === 'finished' && isCorrect && (
                          <svg className="ml-auto shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Answer progress bar */}
                {session.status === 'active' && session.players.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between text-[10px] sm:text-xs text-white/40">
                      <span>Answers received</span>
                      <span>{answeredCount}/{session.players.length}</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brandPurple to-brandBlue rounded-full transition-all duration-500"
                        style={{ width: `${session.players.length > 0 ? (answeredCount / session.players.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass rounded-3xl p-8 sm:p-10 text-center">
                <div className="flex justify-center gap-2 mb-4">
                  {optionClasses.map((cls, i) => (
                    <div key={i} className={`${cls} w-7 h-7 sm:w-8 sm:h-8 rounded-lg animate-bounce`} style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <p className="text-white/40 text-xs sm:text-sm">Waiting for questions to load...</p>
              </div>
            )}

            {/* Game Finished */}
            {session.status === 'finished' && (
              <div className="glass rounded-3xl p-6 sm:p-8 space-y-4 sm:space-y-5 animate-scale-in">
                <div className="text-center">
                  <p className="text-3xl sm:text-4xl mb-2">🏆</p>
                  <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                    Game Finished!
                  </h3>
                </div>

                {/* Podium */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                  {sortedPlayers.slice(0, 3).map((player, index) => {
                    const podiumHeight = index === 0 ? 'h-24 sm:h-28' : index === 1 ? 'h-16 sm:h-20' : 'h-12 sm:h-16';
                    const medals = ['🥇', '🥈', '🥉'];
                    const order = index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3';
                    return (
                      <div key={`podium-${player.name}`} className={`flex flex-col items-center justify-end ${order}`}>
                        <p className="text-xl sm:text-2xl mb-1">{medals[index]}</p>
                        <p className="text-xs sm:text-sm font-bold text-white truncate max-w-full px-1">{player.name}</p>
                        <p className="text-[10px] sm:text-xs text-white/50">{player.score} pts</p>
                        <div className={`w-full ${podiumHeight} bg-gradient-to-t from-brandPurple/40 to-brandPurple/10 rounded-t-xl mt-2 border-t-2 border-brandPurple/60`} />
                      </div>
                    );
                  })}
                </div>

                {/* Full leaderboard */}
                {sortedPlayers.length > 3 && (
                  <div className="space-y-2 mt-4">
                    {sortedPlayers.slice(3).map((player, index) => (
                      <div key={player.name} className="flex items-center justify-between bg-white/5 rounded-xl p-2.5 sm:p-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white/40 min-w-[24px] sm:min-w-[28px]">#{index + 4}</span>
                          <span className="font-semibold text-white text-xs sm:text-sm truncate">{player.name}</span>
                        </div>
                        <span className="font-bold text-white/60 text-xs sm:text-sm shrink-0">{player.score} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Players sidebar */}
          <div className="glass-light rounded-3xl p-4 sm:p-5 text-gray-900 self-start">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold">Players</h2>
              <span className="text-xs sm:text-sm font-semibold text-brandPurple bg-brandPurple/10 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">
                {session.players.length}
              </span>
            </div>

            <div className="space-y-1.5 sm:space-y-2 max-h-[300px] sm:max-h-[500px] overflow-y-auto">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-brandPurple to-brandBlue flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{player.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-400">{player.answers.length} answer{player.answers.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-black text-brandPurple shrink-0">{player.score}</p>
                </div>
              ))}
              {session.players.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-2xl sm:text-3xl mb-2">👋</p>
                  <p className="text-gray-400 text-xs sm:text-sm">Share the PIN for players to join</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
