'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

/**
 * Displays a game PIN with a scannable QR code.
 * The QR code links to /play/{gamePin} on the current host.
 *
 * @param {string} gamePin - The 6-digit game PIN
 * @param {'compact'|'large'} variant - Display size variant
 * @param {boolean} showPin - Whether to show the PIN text below the QR
 */
export default function GameQRCode({ gamePin, variant = 'compact', showPin = true }) {
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}/play/${gamePin}`);
    }
  }, [gamePin]);

  if (!joinUrl) return null;

  const isLarge = variant === 'large';
  const qrSize = isLarge ? 200 : 120;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Code container w/ white padding for scan reliability */}
      <div className={`bg-white rounded-2xl shadow-lg ${isLarge ? 'p-5' : 'p-3'} relative group`}>
        <QRCodeSVG
          value={joinUrl}
          size={qrSize}
          level="M"
          bgColor="#ffffff"
          fgColor="#1e1b4b"
          style={{ display: 'block' }}
        />
        {/* Hover overlay to show URL */}
        <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(joinUrl);
            }
          }}
        >
          <div className="text-center px-3">
            <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15V5a2 2 0 012-2h10" />
            </svg>
            <p className="text-[10px] font-semibold text-brandPurple">Copy Link</p>
          </div>
        </div>
      </div>

      {showPin && (
        <div className="text-center">
          <p className={`font-black tracking-[0.25em] bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent ${isLarge ? 'text-4xl' : 'text-2xl'}`}>
            {gamePin}
          </p>
          <p className={`text-white/40 uppercase tracking-widest font-bold ${isLarge ? 'text-xs mt-1' : 'text-[10px] mt-0.5'}`}>
            Game PIN
          </p>
        </div>
      )}

      <p className="text-[10px] text-white/25 text-center">
        Scan to join or visit the link
      </p>
    </div>
  );
}
