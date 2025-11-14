'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [gamePin, setGamePin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  const joinGame = (event) => {
    event.preventDefault();
    if (gamePin.trim().length === 6 && playerName.trim()) {
      router.push(`/play/${gamePin}?name=${encodeURIComponent(playerName.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brandPurple to-brandBlue flex items-center justify-center p-4">
      <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/40 backdrop-blur">
        <div className="text-center">
          <p className="text-sm uppercase font-semibold tracking-wide text-brandBlue">HSAPSS Canada Presents</p>
          <h1 className="text-4xl font-black text-gray-900 mt-2">HSAPSS Canada Quiz</h1>
          <p className="text-gray-500 mt-2">Create live quizzes and challenge your friends in a Kahoot-style experience.</p>
        </div>

        <form onSubmit={joinGame} className="space-y-4 mt-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Game PIN</label>
            <input
              type="text"
              value={gamePin}
              onChange={(event) => setGamePin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brandPurple focus:border-brandPurple"
              placeholder="Enter 6-digit PIN"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brandPurple focus:border-brandPurple"
              placeholder="Enter your name"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brandPurple text-white py-3 rounded-xl font-semibold shadow-lg shadow-brandPurple/30 hover:bg-purple-700 transition"
          >
            Join Game
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
          <p className="text-sm text-gray-500 text-center">Ready to host your own challenge?</p>
          <button
            onClick={() => router.push('/create')}
            className="w-full bg-brandBlue text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Create Quiz
          </button>
          <div className="p-4 border border-dashed border-gray-300 rounded-xl space-y-3">
            <p className="text-sm font-semibold text-gray-700 text-center">Host controls</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/login')}
                className="bg-gray-900 text-white py-2 rounded-lg text-sm font-semibold hover:bg-gray-800"
              >
                Host Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="bg-white border border-gray-300 text-gray-900 py-2 rounded-lg text-sm font-semibold hover:border-gray-400"
              >
                Register
              </button>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="w-full text-sm text-brandBlue font-semibold hover:underline"
            >
              Go to Admin Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
