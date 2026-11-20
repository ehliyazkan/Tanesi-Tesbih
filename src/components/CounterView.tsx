import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Undo2,
  Vibrate,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { DhikrDefinition } from '../data/dhikrs';
import { useTanesi } from '../context/TanesiContext';
import { calculateProgressPercent } from '../utils/dhikrLogic';
import {
  playBeadClickSound,
  playCompletionChime,
  triggerHaptic,
} from '../utils/feedback';

interface CounterViewProps {
  dhikr: DhikrDefinition;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<DhikrDefinition['category'], string> = {
  daily: 'Günlük Vird',
  weekly: 'Haftanın Tesbihi',
  additional: 'İlave Tesbih',
  special: 'Özel Zikir',
  custom: 'Kendi Tesbihim',
};

export const CounterView: React.FC<CounterViewProps> = ({ dhikr, onBack }) => {
  const {
    getTarget,
    getCountOnDate,
    incrementDhikr,
    resetDhikr,
    setTargetForDhikr,
    settings,
    updateSettings,
  } = useTanesi();

  const count = getCountOnDate(dhikr.slug);
  const target = getTarget(dhikr.slug);
  const percentage = calculateProgressPercent(count, target);
  const completed = count >= target;

  const [justCompletedBanner, setJustCompletedBanner] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(target));
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setTargetInput(String(target));
  }, [target]);

  const handleIncrement = useCallback(() => {
    const result = incrementDhikr(dhikr.slug, 1);
    setPulseKey((k) => k + 1);

    if (result.justCompleted) {
      setJustCompletedBanner(true);
      if (settings.soundEnabled) playCompletionChime();
      if (settings.vibrationEnabled) triggerHaptic([45, 70, 90]);
    } else {
      if (settings.soundEnabled) playBeadClickSound();
      if (settings.vibrationEnabled) triggerHaptic(18);
    }
  }, [dhikr.slug, incrementDhikr, settings.soundEnabled, settings.vibrationEnabled]);

  const handleUndo = useCallback(() => {
    if (count <= 0) return;
    incrementDhikr(dhikr.slug, -1);
    if (settings.vibrationEnabled) triggerHaptic(10);
  }, [count, dhikr.slug, incrementDhikr, settings.vibrationEnabled]);

  const handleConfirmReset = () => {
    resetDhikr(dhikr.slug);
    setJustCompletedBanner(false);
    setConfirmResetOpen(false);
    if (settings.vibrationEnabled) triggerHaptic([20, 40, 20]);
  };

  const handleSaveTarget = () => {
    const parsed = parseInt(targetInput, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100000) {
      setTargetForDhikr(dhikr.slug, parsed);
    }
    setEditingTarget(false);
  };

  // Klavye kısayolu: Boşluk tuşu ile artırma (modal açık değilken)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (confirmResetOpen || editingTarget) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleIncrement();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmResetOpen, editingTarget, handleIncrement]);

  const ringSize = 244;
  const strokeWidth = 8;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen pb-28">
      {/* Üst çubuk */}
      <header className="border-b border-[#D6A83D]/35 bg-[#06452F] text-[#FFF4D8]">
        <div className="mx-auto max-w-4xl px-4 py-3.5 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-5 h-5 text-[#E8C97A]" />
            <span>Geri</span>
          </button>

          <div className="text-center min-w-0">
            <p className="text-[11px] text-[#E8C97A]">
              {CATEGORY_LABELS[dhikr.category]}
            </p>
            <h1 className="font-display text-lg sm:text-xl font-bold truncate">
              {dhikr.title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              aria-label={settings.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
              aria-pressed={settings.soundEnabled}
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                settings.soundEnabled
                  ? 'border-[#D6A83D]/60 bg-[#0B593D] text-[#E8C97A]'
                  : 'border-[#FFF4D8]/20 bg-transparent text-[#FFF4D8]/50'
              }`}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                updateSettings({ vibrationEnabled: !settings.vibrationEnabled })
              }
              aria-label={settings.vibrationEnabled ? 'Titreşimi kapat' : 'Titreşimi aç'}
              aria-pressed={settings.vibrationEnabled}
              className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border transition-colors ${
                settings.vibrationEnabled
                  ? 'border-[#D6A83D]/60 bg-[#0B593D] text-[#E8C97A]'
                  : 'border-[#FFF4D8]/20 bg-transparent text-[#FFF4D8]/50'
              }`}
            >
              <Vibrate className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 lg:min-h-[calc(100vh-144px)] lg:flex lg:flex-col lg:justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
          {/* Sol / Üst: Zikir Metni Kartı */}
          <section className="lg:col-span-6 rounded-2xl border border-[#D6A83D]/40 bg-[#FFF9EB] dark:bg-[#0B261C] p-6 sm:p-7 text-center">
            {dhikr.arabic && (
              <p
                className="font-arabic arabic-xl text-[#06452F] dark:text-[#FFF4D8] leading-[2.15]"
                dir="rtl"
                lang="ar"
              >
                {dhikr.arabic}
              </p>
            )}

            <p className={`${dhikr.arabic ? 'mt-4' : ''} text-base sm:text-lg font-semibold text-[#16362A] dark:text-[#E8C97A] body-scaled`}>
              {dhikr.transliteration}
            </p>

            {dhikr.meaning && (
              <p className="mt-2.5 text-sm leading-relaxed text-[#4A6358] dark:text-[#C5D8CE]">
                {dhikr.meaning}
              </p>
            )}

            {dhikr.note && (
              <p className="mt-3 pt-3 border-t border-[#D6A83D]/20 text-xs italic text-[#546D62] dark:text-[#A9BFB4]">
                {dhikr.note}
              </p>
            )}

            {/* Hedef düzenleme alanı */}
            <div className="mt-5 pt-4 border-t border-[#D6A83D]/25 flex flex-wrap items-center justify-center gap-2 text-xs">
              {editingTarget ? (
                <div className="flex items-center gap-2">
                  <label htmlFor="counter-target-input" className="text-[#4A6358] dark:text-[#A9BFB4]">
                    Hedef:
                  </label>
                  <input
                    id="counter-target-input"
                    type="number"
                    min={1}
                    max={100000}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTarget();
                    }}
                    className="w-20 min-h-[38px] rounded-lg border border-[#D6A83D] bg-white dark:bg-[#071D15] px-2.5 text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTarget}
                    className="min-h-[38px] rounded-lg bg-[#06452F] px-3 text-xs font-medium text-[#FFF4D8]"
                  >
                    Kaydet
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTarget(true)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 text-[#4A6358] dark:text-[#A9BFB4] hover:text-[#06452F] dark:hover:text-[#E8C97A] transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>
                    Hedef: <strong className="tabular-nums text-[#06452F] dark:text-[#FFF4D8]">{target}</strong> (Değiştir)
                  </span>
                </button>
              )}
            </div>
          </section>

          {/* Sağ / Alt: Dairesel Dijital Tesbih Sayacı */}
          <section className="lg:col-span-6 flex flex-col items-center">
            {/* Tamamlandı Altın Bildirimi */}
            <AnimatePresence>
              {(completed || justCompletedBanner) && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  role="status"
                  className="mb-4 flex items-center gap-2 rounded-xl border border-[#D6A83D] bg-[#FFF4D8] dark:bg-[#133829] px-4 py-2.5 text-sm font-semibold text-[#06452F] dark:text-[#E8C97A] shadow-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#B58724] dark:text-[#D6A83D]" />
                  <span>Hedef Tamamlandı — Allah kabul eylesin</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Büyük Dairesel Sayaç Butonu */}
            <div className="relative flex items-center justify-center">
              {/* Altın tamamlanma halesi */}
              {completed && (
                <motion.div
                  key={`halo-${pulseKey}`}
                  initial={{ scale: 0.94, opacity: 0.55 }}
                  animate={{ scale: 1.07, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#D6A83D]"
                />
              )}

              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.12 }}
                onClick={handleIncrement}
                aria-label={`Zikri bir artır, mevcut sayı ${count}, hedef ${target}`}
                data-testid="tasbih-counter-button"
                className="relative flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D6A83D] select-none cursor-pointer"
                style={{ width: ringSize, height: ringSize }}
              >
                {/* İlerleme çemberi SVG */}
                <svg
                  width={ringSize}
                  height={ringSize}
                  className="absolute inset-0 -rotate-90"
                  aria-hidden="true"
                >
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-[#06452F]/12 dark:text-[#FFF4D8]/12"
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={radius}
                    fill="none"
                    stroke={completed ? '#D6A83D' : '#0B593D'}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-[stroke-dashoffset] duration-200 ease-out dark:stroke-[#D6A83D]"
                  />
                </svg>

                {/* İç zümrüt dairesel yüzey */}
                <div
                  className={`flex h-[208px] w-[208px] flex-col items-center justify-center rounded-full border-2 shadow-xl transition-colors ${
                    completed
                      ? 'border-[#D6A83D] bg-gradient-to-b from-[#0B593D] to-[#053524]'
                      : 'border-[#D6A83D]/55 bg-gradient-to-b from-[#084F36] to-[#043222]'
                  }`}
                >
                  <span className="text-[11px] font-medium tracking-wider text-[#E8C97A]/90">
                    ZİKİR SAYACI
                  </span>
                  <motion.span
                    key={count}
                    initial={{ scale: 0.9, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.14 }}
                    data-testid="tasbih-count-value"
                    className="mt-1.5 font-sans text-5xl sm:text-6xl font-bold text-[#FFF4D8] tabular-nums tracking-tight leading-none"
                  >
                    {count.toLocaleString('tr-TR')}
                  </motion.span>
                  <span className="mt-2 text-sm text-[#FFF4D8]/80 tabular-nums">
                    / {target.toLocaleString('tr-TR')}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-[#E8C97A] tabular-nums">
                    %{percentage}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Alt kontrol düğmeleri: Geri Al, +1 Artır, Sıfırla */}
            <div className="mt-7 grid grid-cols-3 gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={handleUndo}
                disabled={count === 0}
                aria-label="Bir geri al"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D6A83D]/45 bg-[#FFF9EB] dark:bg-[#0B261C] px-3 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] hover:border-[#D6A83D] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <Undo2 className="w-4 h-4" />
                <span>Geri Al</span>
              </button>

              <button
                type="button"
                onClick={handleIncrement}
                aria-label="Bir artır"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#06452F] border border-[#D6A83D]/60 px-3 text-sm font-semibold text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-[#E8C97A]" />
                <span>Artır</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                disabled={count === 0}
                aria-label="Sayacı sıfırla"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D6A83D]/45 bg-[#FFF9EB] dark:bg-[#0B261C] px-3 text-sm font-medium text-[#8A2E2E] dark:text-[#F09A9A] hover:border-[#B94A48] disabled:opacity-45 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sıfırla</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Yanlışlıkla sıfırlamayı önleyen onay penceresi */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#D6A83D]/50 bg-[#FFF9EB] dark:bg-[#0B261C] p-6 text-[#0F271E] dark:text-[#F6EED9] shadow-2xl">
            <h2 id="reset-confirm-title" className="font-display text-xl font-bold">
              Sayacı Sıfırla
            </h2>
            <p className="mt-2 text-sm text-[#4A6358] dark:text-[#C5D8CE] leading-relaxed">
              <strong>{dhikr.title}</strong> için bugünkü{' '}
              <strong className="tabular-nums">{count}</strong> tekrar sayısını sıfırlamak
              istediğinizden emin misiniz?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="min-h-[44px] rounded-xl border border-[#D6A83D]/40 px-4 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] hover:bg-[#06452F]/5 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="min-h-[44px] rounded-xl bg-[#9E2A2B] px-4 text-sm font-semibold text-white hover:bg-[#822223]"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
