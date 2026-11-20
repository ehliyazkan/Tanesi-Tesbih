import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const TanesiLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="60"
      height="60"
      rx="16"
      fill="#06452F"
      stroke="#D6A83D"
      strokeWidth="1.5"
      strokeOpacity="0.65"
    />
    <circle cx="32" cy="12" r="2.6" fill="#D6A83D" />
    <circle cx="42" cy="14.7" r="2.1" fill="#D6A83D" />
    <circle cx="49.3" cy="22" r="2.1" fill="#D6A83D" />
    <circle cx="52" cy="32" r="2.1" fill="#D6A83D" />
    <circle cx="49.3" cy="42" r="2.1" fill="#D6A83D" />
    <circle cx="42" cy="49.3" r="2.1" fill="#D6A83D" />
    <circle cx="32" cy="52" r="2.1" fill="#D6A83D" />
    <circle cx="22" cy="49.3" r="2.1" fill="#D6A83D" />
    <circle cx="14.7" cy="42" r="2.1" fill="#D6A83D" />
    <circle cx="12" cy="32" r="2.1" fill="#D6A83D" />
    <circle cx="14.7" cy="22" r="2.1" fill="#D6A83D" />
    <circle cx="22" cy="14.7" r="2.1" fill="#D6A83D" />
    <path
      d="M36.8 23.2C31.2 22.4 26 26 25 31.6C24 37.2 27.7 42.5 33.3 43.5C36.8 44.1 40.3 42.8 42.5 40.2C39.2 41.1 35.6 40.3 33.2 37.7C30.4 34.4 30.7 29.5 33.9 26.6C34.8 25.8 35.8 25.1 36.8 24.6V23.2Z"
      fill="#D6A83D"
    />
    <path
      d="M32 16.5L33.1 19.2L35.8 20.3L33.1 21.4L32 24.1L30.9 21.4L28.2 20.3L30.9 19.2L32 16.5Z"
      fill="#FFF4D8"
    />
  </svg>
);

export const CircularProgress: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  completed?: boolean;
  label?: string;
}> = ({ percentage, size = 50, strokeWidth = 3.5, completed = false, label }) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-label={label ?? `İlerleme yüzde ${clamped}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#06452F]/12 dark:text-[#FFF4D8]/12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={completed ? '#D6A83D' : '#0B593D'}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out dark:stroke-[#D6A83D]"
        />
      </svg>
      <span
        className={`absolute text-[11px] font-semibold tabular-nums ${
          completed
            ? 'text-[#B58724] dark:text-[#E8C97A]'
            : 'text-[#06452F] dark:text-[#FFF4D8]'
        }`}
      >
        %{clamped}
      </span>
    </div>
  );
};

export const SeljukDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#D6A83D]/45 to-[#D6A83D]/45" />
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 1L9.9 6.1L15 8L9.9 9.9L8 15L6.1 9.9L1 8L6.1 6.1L8 1Z"
        stroke="#D6A83D"
        strokeWidth="1.1"
        fill="#D6A83D"
        fillOpacity="0.22"
      />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#D6A83D]/45 to-[#D6A83D]/45" />
  </div>
);

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => {
          install().catch(() => {});
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6A83D]/60 bg-[#06452F] text-[#FFF4D8] font-medium transition-colors hover:bg-[#0B593D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A83D] whitespace-nowrap shrink-0 ${
          compact ? 'min-h-[40px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'
        }`}
      >
        <Download className="w-4 h-4 text-[#D6A83D]" />
        <span>Uygulamayı Yükle</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[#D6A83D]/50 bg-[#FFF4D8]/80 dark:bg-[#0B261C] text-[#06452F] dark:text-[#FFF4D8] font-medium transition-colors hover:border-[#D6A83D] whitespace-nowrap shrink-0 ${
            compact ? 'min-h-[40px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'
          }`}
        >
          <Download className="w-4 h-4 text-[#B58724] dark:text-[#D6A83D]" />
          <span>Ana Ekrana Ekle</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl border border-[#D6A83D]/40 bg-[#FFF9EB] dark:bg-[#0B261C] p-6 text-[#0F271E] dark:text-[#F6EED9] shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 id="ios-install-title" className="font-display text-xl font-semibold">
                  iPhone / iPad’e Yükle
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Kapat"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-[#06452F]/10 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#2C4A3E] dark:text-[#C5D8CE]">
                <li>1. Safari alt çubuğundaki <strong>Paylaş</strong> simgesine dokunun.</li>
                <li>2. Açılan menüde <strong>Ana Ekrana Ekle</strong> seçeneğine dokunun.</li>
                <li>3. Sağ üstten <strong>Ekle</strong> diyerek TANESİ’yi uygulama olarak başlatın.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#06452F] text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-xl border border-[#D6A83D]/50 bg-[#06452F] px-3.5 py-2 text-xs font-medium text-[#FFF4D8] shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#D6A83D]" />
      <span>Çevrimdışı mod — Sayaçlar cihazınızda güvenle saklanıyor.</span>
    </div>
  );
};
