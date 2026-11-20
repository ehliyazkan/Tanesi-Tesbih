import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Settings,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import {
  ADDITIONAL_DHIKRS,
  DAILY_DHIKRS,
  SPECIAL_DHIKRS,
  WEEKDAY_NAMES_TR,
  WEEKDAY_ORDER,
  WEEKDAY_SHORT_TR,
  getWeeklyDhikrByWeekday,
  type DhikrDefinition,
} from '../data/dhikrs';
import { useTanesi } from '../context/TanesiContext';
import {
  calculateProgressPercent,
  getDailyVirdsSummary,
} from '../utils/dhikrLogic';
import {
  CircularProgress,
  PWAInstallButton,
  SeljukDivider,
  TanesiLogoMark,
} from './OrnamentPrimitives';
import { TesbihPosterModal } from './TesbihPosterModal';
import { CustomDhikrModal } from './CustomDhikrModal';

interface HomeViewProps {
  onOpenCounter: (dhikr: DhikrDefinition) => void;
  onOpenSettings: () => void;
}

const HERO_MOSQUE_IMAGE = '/src/assets/images/hero_mosque_emerald_1795165290337.jpg';

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenCounter,
  onOpenSettings,
}) => {
  const {
    todayDateKey,
    todayWeekday,
    displayDate,
    records,
    customTargets,
    customDhikrs,
    getTarget,
    getCountOnDate,
    setTargetForDhikr,
    saveCustomDhikr,
    deleteCustomDhikr,
  } = useTanesi();

  const [selectedWeekday, setSelectedWeekday] = useState<number>(todayWeekday);
  const [posterOpen, setPosterOpen] = useState(false);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingCustomDhikr, setEditingCustomDhikr] = useState<DhikrDefinition | null>(null);
  const [deletingCustomDhikr, setDeletingCustomDhikr] = useState<DhikrDefinition | null>(null);
  const [editingTargetSlug, setEditingTargetSlug] = useState<string | null>(null);
  const [customTargetDraft, setCustomTargetDraft] = useState<string>('');
  const [heroImgError, setHeroImgError] = useState(false);

  const dailySummary = useMemo(
    () => getDailyVirdsSummary(records, todayDateKey, customTargets),
    [records, todayDateKey, customTargets]
  );

  const activeWeeklyDhikr = useMemo(
    () => getWeeklyDhikrByWeekday(selectedWeekday),
    [selectedWeekday]
  );

  const specialDhikr = SPECIAL_DHIKRS[0];

  const formattedTurkishDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
      }).format(displayDate);
    } catch {
      return todayDateKey;
    }
  }, [displayDate, todayDateKey]);

  const weeklyCount = getCountOnDate(activeWeeklyDhikr.slug);
  const weeklyTarget = getTarget(activeWeeklyDhikr.slug);
  const weeklyPct = calculateProgressPercent(weeklyCount, weeklyTarget);

  const specialCount = getCountOnDate(specialDhikr.slug);
  const specialTarget = getTarget(specialDhikr.slug);
  const specialPct = calculateProgressPercent(specialCount, specialTarget);

  const startTargetEdit = (dhikr: DhikrDefinition) => {
    setEditingTargetSlug(dhikr.slug);
    setCustomTargetDraft(String(getTarget(dhikr.slug)));
  };

  const commitTargetEdit = (slug: string) => {
    const parsed = parseInt(customTargetDraft, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 100000) {
      setTargetForDhikr(slug, parsed);
    }
    setEditingTargetSlug(null);
  };

  return (
    <div className="pb-28">
      {/* ÜST BÖLÜM: TANESİ HERO HEADER */}
      <header className="relative overflow-hidden bg-[#06452F] text-[#FFF4D8] border-b border-[#D6A83D]/40">
        {!heroImgError ? (
          <img
            src={HERO_MOSQUE_IMAGE}
            alt="Osmanlı cami silüeti ve altın hilal"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
          />
        ) : (
          <div className="absolute inset-0 seljuk-pattern opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06452F]/80 via-[#06452F]/55 to-[#042E1F]/95" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
          {/* Üst satır: Logo + Başlık + Ayarlar */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <TanesiLogoMark size={48} className="shrink-0 shadow-md" />
              <div className="min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-[0.14em] text-[#FFF4D8] leading-tight">
                  TANESİ
                </h1>
                <p className="text-xs sm:text-sm text-[#E8C97A] tracking-wide">
                  Zikir ve Tesbih Uygulaması
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton compact />
              <button
                type="button"
                onClick={() => {
                  setEditingCustomDhikr(null);
                  setCustomModalOpen(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#D6A83D]/55 bg-[#0B593D]/85 px-3.5 text-xs sm:text-sm font-medium text-[#FFF4D8] hover:border-[#D6A83D] hover:bg-[#0E6A4A] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-[#E8C97A]" />
                <span>Tesbih Ekle</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Ayarlar"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#D6A83D]/40 bg-[#06452F]/70 text-[#FFF4D8] backdrop-blur-xs hover:border-[#D6A83D] hover:bg-[#0B593D] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A83D]"
              >
                <Settings className="w-5 h-5 text-[#E8C97A]" />
              </button>
            </div>
          </div>

          {/* Orta huzur sözü ve günlük özet şeridi */}
          <div className="mt-7 lg:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-7">
              <p className="text-xs text-[#E8C97A]/90 tracking-wide">
                {formattedTurkishDate}
              </p>
              <blockquote className="mt-2 font-display text-2xl sm:text-3xl lg:text-[2.15rem] font-medium text-[#FFF4D8] leading-snug [text-wrap:balance]">
                “Allah’ı zikreden kalpler huzur bulur.”
              </blockquote>
            </div>

            {/* Günlük Toplam Hedef Özeti (1.400) */}
            <div className="lg:col-span-5 rounded-2xl border border-[#D6A83D]/40 bg-[#042D1E]/75 backdrop-blur-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#E8C97A]">Günlük Vird İlerlemesi</p>
                  <p className="mt-1 text-2xl font-bold text-[#FFF4D8] tabular-nums">
                    {dailySummary.completedRepeats.toLocaleString('tr-TR')}{' '}
                    <span className="text-sm font-normal text-[#FFF4D8]/70">
                      / {dailySummary.totalTarget.toLocaleString('tr-TR')} tekrar
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#FFF4D8]/75 tabular-nums">
                    {dailySummary.completedVirdCount} / {dailySummary.totalVirdCount} vird tamamlandı
                  </p>
                </div>
                <div className="relative inline-flex items-center justify-center shrink-0">
                  <svg width="60" height="60" className="-rotate-90" aria-hidden="true">
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke="rgba(255,244,216,0.18)"
                      strokeWidth="4.5"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke="#D6A83D"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 25}
                      strokeDashoffset={
                        2 * Math.PI * 25 - (dailySummary.percentage / 100) * 2 * Math.PI * 25
                      }
                      className="transition-[stroke-dashoffset] duration-300"
                    />
                  </svg>
                  <span className="absolute text-xs font-semibold text-[#E8C97A] tabular-nums">
                    %{dailySummary.percentage}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* BÖLÜM A: GÜNLÜK VİRDLERİM */}
        <section aria-labelledby="section-daily-virds">
          <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
            <div>
              <h2
                id="section-daily-virds"
                className="font-display text-2xl sm:text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
              >
                Günlük Virdlerim
              </h2>
              <p className="mt-0.5 text-sm text-[#4A6358] dark:text-[#A9BFB4]">
                5 temel zikir · Günlük toplam hedef{' '}
                <span className="font-semibold text-[#06452F] dark:text-[#E8C97A] tabular-nums">
                  {dailySummary.totalTarget.toLocaleString('tr-TR')}
                </span>{' '}
                tekrar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAILY_DHIKRS.map((dhikr, index) => {
              const count = getCountOnDate(dhikr.slug);
              const target = getTarget(dhikr.slug);
              const pct = calculateProgressPercent(count, target);
              const completed = count >= target;
              const isFifthSpan = index === 4;

              return (
                <button
                  key={dhikr.slug}
                  type="button"
                  onClick={() => onOpenCounter(dhikr)}
                  aria-label={`${dhikr.title} sayacını aç, mevcut ${count} / ${target}`}
                  className={`group text-left rounded-2xl border p-5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A83D] ${
                    isFifthSpan ? 'md:col-span-2 lg:col-span-2' : ''
                  } ${
                    completed
                      ? 'border-[#D6A83D] bg-[#FFF8E4] dark:bg-[#0D2E22]'
                      : 'border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] hover:border-[#D6A83D]/80 hover:bg-[#FFFDF5] dark:hover:bg-[#0F3124]'
                  }`}
                >
                  <div
                    className={`flex items-start justify-between gap-4 ${
                      isFifthSpan ? 'md:items-center' : ''
                    }`}
                  >
                    <div
                      className={`min-w-0 flex-1 ${
                        isFifthSpan
                          ? 'md:flex md:items-center md:justify-between md:gap-8'
                          : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                          <span className="font-semibold text-[#06452F] dark:text-[#FFF4D8] text-base">
                            {dhikr.title}
                          </span>
                          {completed && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B58724] dark:text-[#E8C97A]">
                              · <Check className="w-3.5 h-3.5" /> Tamamlandı
                            </span>
                          )}
                        </div>

                        {!isFifthSpan && (
                          <p
                            className="mt-2 font-arabic arabic-md text-right text-[#06452F] dark:text-[#FFF4D8]"
                            dir="rtl"
                            lang="ar"
                          >
                            {dhikr.arabic}
                          </p>
                        )}

                        <p className="mt-1.5 text-sm text-[#2C4A3E] dark:text-[#C5D8CE] body-scaled">
                          {dhikr.transliteration}
                        </p>
                        {dhikr.note && (
                          <p className="mt-1 text-xs italic text-[#546D62] dark:text-[#A9BFB4]">
                            {dhikr.note}
                          </p>
                        )}
                      </div>

                      {isFifthSpan && (
                        <p
                          className="mt-2 md:mt-0 font-arabic arabic-xl text-right md:text-center md:px-6 text-[#06452F] dark:text-[#FFF4D8]"
                          dir="rtl"
                          lang="ar"
                        >
                          {dhikr.arabic}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end justify-between gap-3 shrink-0">
                      <CircularProgress percentage={pct} completed={completed} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D6A83D]/20 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#06452F] dark:text-[#E8C97A] tabular-nums">
                      {count.toLocaleString('tr-TR')} / {target.toLocaleString('tr-TR')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#0B593D] dark:text-[#C5D8CE] group-hover:text-[#B58724] dark:group-hover:text-[#E8C97A] transition-colors">
                      Sayaca geç
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <SeljukDivider />

        {/* BÖLÜM B (HAFTANIN GÜNLÜK TESBİHİ) & BÖLÜM D (ÖZEL ZİKİR) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* BÖLÜM B: HAFTANIN GÜNLÜK TESBİHİ */}
          <section
            aria-labelledby="section-weekly-tesbih"
            className="lg:col-span-7 flex flex-col rounded-2xl border border-[#D6A83D]/40 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2
                  id="section-weekly-tesbih"
                  className="font-display text-2xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
                >
                  Haftanın Günlük Tesbihi
                </h2>
                <p className="text-xs sm:text-sm text-[#4A6358] dark:text-[#A9BFB4]">
                  Bugün: <strong className="text-[#06452F] dark:text-[#E8C97A]">{WEEKDAY_NAMES_TR[todayWeekday]}</strong> · Her gün 100 tekrar
                </p>
              </div>
              {selectedWeekday !== todayWeekday && (
                <button
                  type="button"
                  onClick={() => setSelectedWeekday(todayWeekday)}
                  className="min-h-[38px] px-3 rounded-lg border border-[#D6A83D]/45 text-xs font-medium text-[#06452F] dark:text-[#E8C97A] hover:bg-[#D6A83D]/10 transition-colors whitespace-nowrap"
                >
                  Bugüne Dön
                </button>
              )}
            </div>

            {/* Haftanın gün seçicisi (etkileşimli butonlar) */}
            <div
              className="mt-4 grid grid-cols-7 gap-1.5"
              role="tablist"
              aria-label="Haftanın günleri"
            >
              {WEEKDAY_ORDER.map((dayNum) => {
                const isSelected = selectedWeekday === dayNum;
                const isToday = todayWeekday === dayNum;
                const dayDef = getWeeklyDhikrByWeekday(dayNum);
                const dayDone =
                  getCountOnDate(dayDef.slug) >= getTarget(dayDef.slug);

                return (
                  <button
                    key={dayNum}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedWeekday(dayNum)}
                    className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#06452F] text-[#FFF4D8] border border-[#D6A83D]'
                        : isToday
                        ? 'bg-[#D6A83D]/20 text-[#06452F] dark:text-[#E8C97A] border border-[#D6A83D]/55'
                        : 'bg-[#F8EED8]/70 dark:bg-[#071D15] text-[#2C4A3E] dark:text-[#A9BFB4] border border-transparent hover:border-[#D6A83D]/40'
                    }`}
                  >
                    <span>{WEEKDAY_SHORT_TR[dayNum]}</span>
                    {dayDone && (
                      <Check
                        className={`w-3 h-3 mt-0.5 ${
                          isSelected ? 'text-[#E8C97A]' : 'text-[#0B593D] dark:text-[#D6A83D]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Seçili günün tesbih içeriği */}
            <div className="mt-5 flex-1 flex flex-col justify-between rounded-xl border border-[#D6A83D]/30 bg-[#FFF4D8]/65 dark:bg-[#071D15] p-5">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                  <span className="font-semibold text-[#06452F] dark:text-[#E8C97A]">
                    {WEEKDAY_NAMES_TR[selectedWeekday]} Tesbihi
                    {selectedWeekday === todayWeekday ? ' · Bugünün Zikri' : ''}
                  </span>
                  <span className="tabular-nums font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                    {weeklyCount} / {weeklyTarget}
                  </span>
                </div>

                <p
                  className="mt-4 font-arabic arabic-lg text-center text-[#06452F] dark:text-[#FFF4D8]"
                  dir="rtl"
                  lang="ar"
                >
                  {activeWeeklyDhikr.arabic}
                </p>

                <p className="mt-3 text-center text-sm sm:text-base font-medium text-[#1B3A2E] dark:text-[#E2ECE6] body-scaled">
                  {activeWeeklyDhikr.transliteration}
                </p>

                <p className="mt-2 text-center text-xs sm:text-sm text-[#546D62] dark:text-[#A9BFB4]">
                  {activeWeeklyDhikr.meaning}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#D6A83D]/25 flex items-center justify-between gap-4">
                <CircularProgress
                  percentage={weeklyPct}
                  completed={weeklyCount >= weeklyTarget}
                />
                <button
                  type="button"
                  onClick={() => onOpenCounter(activeWeeklyDhikr)}
                  className="min-h-[44px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-[#06452F] px-5 py-2.5 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D6A83D] whitespace-nowrap"
                >
                  <span>Tesbih Sayacını Aç</span>
                  <ArrowRight className="w-4 h-4 text-[#E8C97A]" />
                </button>
              </div>
            </div>
          </section>

          {/* BÖLÜM D: ÖZEL ZİKİR */}
          <section
            aria-labelledby="section-special-dhikr"
            className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-[#D6A83D]/55 bg-[#06452F] text-[#FFF4D8] p-6 relative overflow-hidden"
          >
            <div className="pointer-events-none absolute inset-0 seljuk-pattern opacity-30" />

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-[#E8C97A]">
                <h2
                  id="section-special-dhikr"
                  className="font-display text-2xl font-semibold text-[#FFF4D8]"
                >
                  Özel Zikir
                </h2>
                <span className="tabular-nums font-medium">
                  {specialCount} / {specialTarget}
                </span>
              </div>

              <div className="my-7 py-4 border-y border-[#D6A83D]/30 text-center">
                <p
                  className="font-arabic arabic-xl text-center text-[#FFF4D8] leading-[2.15]"
                  dir="rtl"
                  lang="ar"
                >
                  {specialDhikr.arabic}
                </p>
                <p className="mt-4 text-base font-medium text-[#E8C97A]">
                  {specialDhikr.transliteration}
                </p>
                <p className="mt-2 text-xs sm:text-sm text-[#FFF4D8]/80 leading-relaxed">
                  {specialDhikr.meaning}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="text-xs text-[#FFF4D8]/80 tabular-nums">
                Hedef: <strong className="text-[#E8C97A]">{specialTarget}</strong> tekrar · %{specialPct}
              </div>
              <button
                type="button"
                onClick={() => onOpenCounter(specialDhikr)}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#D6A83D] px-5 py-2.5 text-sm font-semibold text-[#063222] hover:bg-[#E2B852] transition-colors whitespace-nowrap"
              >
                <span>Zikre Başla</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>

        <SeljukDivider />

        {/* BÖLÜM C: GÜNLÜK VİRDLERE EK TESBİHLER */}
        <section aria-labelledby="section-additional-tesbihs">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <h2
                id="section-additional-tesbihs"
                className="font-display text-2xl sm:text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
              >
                Günlük Virdlere Ek Tesbihler
              </h2>
              <p className="mt-0.5 text-sm text-[#4A6358] dark:text-[#A9BFB4]">
                7 faziletli ilave tesbih · Tekrar hedeflerini dilediğiniz gibi güncelleyebilirsiniz
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPosterOpen(true)}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#D6A83D]/60 bg-[#FFF9EB] dark:bg-[#0B261C] px-4 py-2 text-sm font-medium text-[#06452F] dark:text-[#E8C97A] hover:bg-[#FFF4D8] dark:hover:bg-[#0F3326] transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 text-[#B58724] dark:text-[#D6A83D]" />
              <span>Orijinal Tesbih Görselini Aç</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADDITIONAL_DHIKRS.map((dhikr) => {
              const count = getCountOnDate(dhikr.slug);
              const target = getTarget(dhikr.slug);
              const pct = calculateProgressPercent(count, target);
              const completed = count >= target;
              const isEditing = editingTargetSlug === dhikr.slug;

              return (
                <article
                  key={dhikr.slug}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                    completed
                      ? 'border-[#D6A83D] bg-[#FFF8E4] dark:bg-[#0D2E22]'
                      : 'border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                        {dhikr.title}
                      </h3>
                      <CircularProgress percentage={pct} size={46} completed={completed} />
                    </div>

                    <p
                      className="mt-3 font-arabic arabic-sm text-right text-[#06452F] dark:text-[#FFF4D8]"
                      dir="rtl"
                      lang="ar"
                    >
                      {dhikr.arabic}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-[#2C4A3E] dark:text-[#C5D8CE] body-scaled">
                      {dhikr.transliteration}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D6A83D]/20 flex flex-wrap items-center justify-between gap-3">
                    {/* Hedef düzenleyici */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        {dhikr.targetOptions?.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setTargetForDhikr(dhikr.slug, opt);
                              setEditingTargetSlug(null);
                            }}
                            className={`min-h-[36px] px-2.5 rounded-lg text-xs font-semibold tabular-nums border ${
                              target === opt
                                ? 'bg-[#06452F] text-[#FFF4D8] border-[#06452F]'
                                : 'border-[#D6A83D]/45 text-[#06452F] dark:text-[#E8C97A]'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          aria-label={`${dhikr.title} özel hedef`}
                          value={customTargetDraft}
                          onChange={(e) => setCustomTargetDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitTargetEdit(dhikr.slug);
                          }}
                          className="w-16 min-h-[36px] rounded-lg border border-[#D6A83D]/60 bg-white dark:bg-[#071D15] px-2 text-xs font-semibold text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => commitTargetEdit(dhikr.slug)}
                          className="min-h-[36px] px-2.5 rounded-lg bg-[#06452F] text-xs font-medium text-[#FFF4D8]"
                        >
                          Kaydet
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-[#06452F] dark:text-[#E8C97A] tabular-nums">
                          {count} / {target}
                        </span>
                        <span aria-hidden="true" className="text-[#D6A83D]">
                          ·
                        </span>
                        <button
                          type="button"
                          onClick={() => startTargetEdit(dhikr)}
                          aria-label={`${dhikr.title} hedefini değiştir`}
                          className="inline-flex items-center gap-1 min-h-[36px] text-[#4A6358] dark:text-[#A9BFB4] hover:text-[#06452F] dark:hover:text-[#E8C97A] transition-colors"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Hedef değiştir</span>
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenCounter(dhikr)}
                      aria-label={`${dhikr.title} sayacını aç`}
                      className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#06452F] px-4 py-2 text-xs font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
                    >
                      <span>Sayaca Geç</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#E8C97A]" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <SeljukDivider />

        {/* BÖLÜM E: KENDİ TESBİHLERİM (KULLANICININ EKLEDİĞİ TESBİHLER) */}
        <section aria-labelledby="section-custom-dhikrs">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
            <div>
              <h2
                id="section-custom-dhikrs"
                className="font-display text-2xl sm:text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
              >
                Kendi Tesbihlerim
              </h2>
              <p className="mt-0.5 text-sm text-[#4A6358] dark:text-[#A9BFB4]">
                Kendi belirlediğiniz özel zikir, esmâ ve dualarınız ·{' '}
                <span className="tabular-nums font-medium text-[#06452F] dark:text-[#E8C97A]">
                  {customDhikrs.length} kayıt
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingCustomDhikr(null);
                setCustomModalOpen(true);
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#06452F] border border-[#D6A83D]/60 px-4 py-2 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-[#E8C97A]" />
              <span>Yeni Tesbih Ekle</span>
            </button>
          </div>

          {customDhikrs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D6A83D]/55 bg-[#FFF9EB]/80 dark:bg-[#0B261C]/70 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                  Henüz kendi tesbihinizi eklemediniz
                </h3>
                <p className="mt-1 text-sm text-[#4A6358] dark:text-[#A9BFB4]">
                  Düzenli çektiğiniz esmâ, salavat veya özel dualarınızı Arapça metni, okunuşu ve hedef sayısıyla ekleyerek günlük takip edebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCustomDhikr(null);
                  setCustomModalOpen(true);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#D6A83D] bg-[#FFF4D8] dark:bg-[#0F3326] px-4 py-2 text-sm font-semibold text-[#06452F] dark:text-[#E8C97A] hover:bg-[#F5E4BC] dark:hover:bg-[#134231] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>İlk Tesbihini Ekle</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customDhikrs.map((dhikr) => {
                const count = getCountOnDate(dhikr.slug);
                const target = getTarget(dhikr.slug);
                const pct = calculateProgressPercent(count, target);
                const completed = count >= target;

                return (
                  <article
                    key={dhikr.slug}
                    className={`flex flex-col justify-between rounded-2xl border p-5 transition-colors ${
                      completed
                        ? 'border-[#D6A83D] bg-[#FFF8E4] dark:bg-[#0D2E22]'
                        : 'border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                            {dhikr.title}
                          </h3>
                          {dhikr.note && (
                            <p className="mt-0.5 text-xs italic text-[#546D62] dark:text-[#A9BFB4]">
                              {dhikr.note}
                            </p>
                          )}
                        </div>
                        <CircularProgress percentage={pct} size={46} completed={completed} />
                      </div>

                      {dhikr.arabic && (
                        <p
                          className="mt-3 font-arabic arabic-md text-right text-[#06452F] dark:text-[#FFF4D8]"
                          dir="rtl"
                          lang="ar"
                        >
                          {dhikr.arabic}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-[#2C4A3E] dark:text-[#C5D8CE] body-scaled">
                        {dhikr.transliteration}
                      </p>

                      {dhikr.meaning && (
                        <p className="mt-1 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                          {dhikr.meaning}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D6A83D]/20 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[#06452F] dark:text-[#E8C97A] tabular-nums mr-1">
                          {count.toLocaleString('tr-TR')} / {target.toLocaleString('tr-TR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomDhikr(dhikr);
                            setCustomModalOpen(true);
                          }}
                          aria-label={`${dhikr.title} tesbihini düzenle`}
                          className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#4A6358] dark:text-[#A9BFB4] hover:bg-[#06452F]/10 dark:hover:bg-white/10 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCustomDhikr(dhikr)}
                          aria-label={`${dhikr.title} tesbihini sil`}
                          className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#8A2E2E] dark:text-[#F09A9A] hover:bg-[#8A2E2E]/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenCounter(dhikr)}
                        aria-label={`${dhikr.title} sayacını aç`}
                        className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#06452F] px-4 py-2 text-xs font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
                      >
                        <span>Sayaca Geç</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#E8C97A]" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <TesbihPosterModal
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        onSelectDhikr={onOpenCounter}
      />

      <CustomDhikrModal
        open={customModalOpen}
        editingDhikr={editingCustomDhikr}
        onClose={() => {
          setCustomModalOpen(false);
          setEditingCustomDhikr(null);
        }}
        onSubmit={saveCustomDhikr}
      />

      {deletingCustomDhikr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-custom-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#D6A83D]/50 bg-[#FFF9EB] dark:bg-[#0B261C] p-6 text-[#0F271E] dark:text-[#F6EED9] shadow-2xl">
            <h2 id="delete-custom-title" className="font-display text-xl font-bold">
              Tesbihi Sil
            </h2>
            <p className="mt-2 text-sm text-[#4A6358] dark:text-[#C5D8CE] leading-relaxed">
              <strong>{deletingCustomDhikr.title}</strong> tesbihini listenizden kaldırmak istediğinizden emin misiniz?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingCustomDhikr(null)}
                className="min-h-[44px] rounded-xl border border-[#D6A83D]/40 px-4 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] hover:bg-[#06452F]/5 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomDhikr(deletingCustomDhikr.slug);
                  setDeletingCustomDhikr(null);
                }}
                className="min-h-[44px] rounded-xl bg-[#9E2A2B] px-4 text-sm font-semibold text-white hover:bg-[#822223]"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
