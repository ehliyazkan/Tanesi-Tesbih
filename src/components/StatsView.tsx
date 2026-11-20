import React, { useMemo } from 'react';
import { Check, Flame } from 'lucide-react';
import { DAILY_DHIKRS, WEEKDAY_SHORT_TR } from '../data/dhikrs';
import { useTanesi } from '../context/TanesiContext';
import {
  calculateProgressPercent,
  computeStatistics,
} from '../utils/dhikrLogic';

export const StatsView: React.FC = () => {
  const {
    records,
    todayDateKey,
    customTargets,
    customDhikrs,
    getTarget,
    getCountOnDate,
  } = useTanesi();

  const stats = useMemo(
    () => computeStatistics(records, todayDateKey, customTargets, customDhikrs),
    [records, todayDateKey, customTargets, customDhikrs]
  );

  const maxWeeklyDay = Math.max(
    100,
    ...stats.weeklySeries.map((item) => item.total)
  );
  const maxTopCount = Math.max(
    1,
    ...stats.topDhikrs.map((item) => item.totalCount)
  );

  return (
    <div className="pb-28">
      <header className="border-b border-[#D6A83D]/35 bg-[#06452F] text-[#FFF4D8]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              İstatistikler ve Geçmiş
            </h1>
            <p className="mt-1 text-sm text-[#E8C97A]/90">
              Günlük vird ilerlemeniz, haftalık tesbih takibi ve 30 günlük devamlılık kaydınız
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#D6A83D]/40 bg-[#042E1F]/80 px-4 py-2 text-sm">
            <Flame className="w-4 h-4 text-[#D6A83D]" />
            <span className="text-[#FFF4D8]/80">Devamlılık Serisi:</span>
            <strong className="text-[#E8C97A] tabular-nums">
              {stats.currentStreakDays} gün
            </strong>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-7 space-y-8">
        {/* 4 Temel Metrik Kartı */}
        <section
          aria-label="Özet İstatistikler"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5">
            <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Bugün Tamamlanan Zikir
            </p>
            <p
              data-testid="stats-today-total"
              className="mt-2 font-display text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
            >
              {stats.todayTotalRepeats.toLocaleString('tr-TR')}
            </p>
            <p className="mt-1 text-xs text-[#4A6358] dark:text-[#A9BFB4]">
              Tüm kategoriler toplamı
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5">
            <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Günlük Vird Yüzdesi
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-[#B58724] dark:text-[#E8C97A] tabular-nums">
              %{stats.todayDailyVirdSummary.percentage}
            </p>
            <p className="mt-1 text-xs text-[#4A6358] dark:text-[#A9BFB4] tabular-nums">
              {stats.todayDailyVirdSummary.completedVirdCount} /{' '}
              {stats.todayDailyVirdSummary.totalVirdCount} vird tamamlandı
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5">
            <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Haftalık Toplam Tekrar
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8] tabular-nums">
              {stats.weeklyTotalRepeats.toLocaleString('tr-TR')}
            </p>
            <p className="mt-1 text-xs text-[#4A6358] dark:text-[#A9BFB4]">
              Bu hafta (Pzt – Paz)
            </p>
          </div>

          <div className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5">
            <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Aylık Toplam Tekrar
            </p>
            <p className="mt-2 font-display text-3xl font-bold text-[#06452F] dark:text-[#FFF4D8] tabular-nums">
              {stats.monthlyTotalRepeats.toLocaleString('tr-TR')}
            </p>
            <p className="mt-1 text-xs text-[#4A6358] dark:text-[#A9BFB4]">
              Son 30 gün toplamı
            </p>
          </div>
        </section>

        {/* Haftalık Grafik & Tamamlanan Günlük Virdler */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Haftalık Tekrar Grafiği */}
          <section className="lg:col-span-7 rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
              Haftalık Zikir Dağılımı
            </h2>
            <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Haftanın her günü kaydedilen toplam tekrarlar
            </p>

            <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 pt-6">
              {stats.weeklySeries.map((day) => {
                const heightPct =
                  day.total > 0
                    ? Math.max(10, Math.round((day.total / maxWeeklyDay) * 100))
                    : 4;
                return (
                  <div
                    key={day.dateKey}
                    className="flex flex-col items-center justify-end h-full gap-2"
                  >
                    <span className="text-[11px] font-medium text-[#4A6358] dark:text-[#C5D8CE] tabular-nums">
                      {day.total > 0 ? day.total.toLocaleString('tr-TR') : '0'}
                    </span>
                    <div className="w-full max-w-[38px] flex-1 flex items-end rounded-t-lg bg-[#06452F]/6 dark:bg-white/5 overflow-hidden">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          day.isToday
                            ? 'bg-[#D6A83D]'
                            : day.total > 0
                            ? 'bg-[#0B593D] dark:bg-[#1C7A56]'
                            : 'bg-[#06452F]/15 dark:bg-white/10'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        day.isToday
                          ? 'text-[#B58724] dark:text-[#E8C97A] font-semibold'
                          : 'text-[#546D62] dark:text-[#A9BFB4]'
                      }`}
                    >
                      {WEEKDAY_SHORT_TR[day.weekday]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bugünkü Günlük Virdler Durumu */}
          <section className="lg:col-span-5 rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
              Tamamlanan Günlük Virdler
            </h2>
            <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Bugünkü 5 temel virdin ayrıntılı ilerlemesi
            </p>

            <div className="mt-5 space-y-4">
              {DAILY_DHIKRS.map((dhikr) => {
                const count = getCountOnDate(dhikr.slug);
                const target = getTarget(dhikr.slug);
                const pct = calculateProgressPercent(count, target);
                const done = count >= target;
                return (
                  <div key={dhikr.slug}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#06452F] dark:text-[#FFF4D8] flex items-center gap-1.5">
                        {dhikr.title}
                        {done && (
                          <Check className="w-3.5 h-3.5 text-[#B58724] dark:text-[#D6A83D]" />
                        )}
                      </span>
                      <span className="tabular-nums text-[#4A6358] dark:text-[#C5D8CE]">
                        {count.toLocaleString('tr-TR')} / {target.toLocaleString('tr-TR')} (%{pct})
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#06452F]/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          done ? 'bg-[#D6A83D]' : 'bg-[#0B593D] dark:bg-[#238A62]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Haftalık Tesbih Başarı Durumu */}
        <section className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
            Haftalık Tesbih Başarı Durumu
          </h2>
          <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
            Her günün özel tesbih kaydı kendi tarihinde saklanır ve silinmez
          </p>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stats.weeklyTesbihStatus.map((day) => (
              <div
                key={day.dateKey}
                className={`rounded-xl border p-3.5 ${
                  day.completed
                    ? 'border-[#D6A83D] bg-[#FFF4D8] dark:bg-[#113527]'
                    : day.isToday
                    ? 'border-[#0B593D]/60 dark:border-[#D6A83D]/50 bg-[#F8EED8]/70 dark:bg-[#081F17]'
                    : 'border-[#D6A83D]/20 bg-[#F8EED8]/45 dark:bg-[#071B14]'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                    {WEEKDAY_SHORT_TR[day.weekday]}
                  </span>
                  <span className="text-[11px] text-[#546D62] dark:text-[#A9BFB4] tabular-nums">
                    {day.dateKey.slice(5)}
                  </span>
                </div>
                <p className="mt-2 text-lg font-bold text-[#06452F] dark:text-[#E8C97A] tabular-nums">
                  {day.count} / {day.target}
                </p>
                <p className="mt-1 text-[11px] text-[#4A6358] dark:text-[#C5D8CE]">
                  {day.completed
                    ? 'Tamamlandı'
                    : day.count > 0
                    ? 'Devam ediyor'
                    : day.isToday
                    ? 'Bugün bekliyor'
                    : 'Kayıt yok'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Devamlılık Takvimi & En Çok Yapılan Zikirler */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Günlük Devamlılık Takvimi */}
          <section className="lg:col-span-6 rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
                  Günlük Devamlılık Takvimi
                </h2>
                <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                  Son 30 günlük zikir yoğunluğunuz
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-6 sm:grid-cols-10 gap-2">
              {stats.continuityCalendar.map((cell) => {
                const levelClasses =
                  cell.level === 3
                    ? 'bg-[#D6A83D] text-[#063222] border-[#B58724]'
                    : cell.level === 2
                    ? 'bg-[#06452F] text-[#FFF4D8] border-[#06452F] dark:bg-[#197250]'
                    : cell.level === 1
                    ? 'bg-[#0B593D]/30 text-[#06452F] dark:bg-[#0F3D2B] dark:text-[#FFF4D8] border-[#0B593D]/40'
                    : 'bg-[#F8EED8]/70 dark:bg-[#071B14] text-[#546D62] dark:text-[#7D968A] border-[#D6A83D]/20';

                return (
                  <div
                    key={cell.dateKey}
                    title={`${cell.dateKey}: ${cell.total.toLocaleString('tr-TR')} tekrar`}
                    className={`flex flex-col items-center justify-center rounded-lg border py-2 text-center ${levelClasses} ${
                      cell.isToday ? 'ring-2 ring-[#D6A83D] ring-offset-1 dark:ring-offset-[#0B261C]' : ''
                    }`}
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {cell.dayNumber}
                    </span>
                    <span className="text-[9px] opacity-80 tabular-nums">
                      {cell.total > 0 ? cell.total : '–'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-[#546D62] dark:text-[#A9BFB4]">
              <span>Yoğunluk:</span>
              <span>0: Kayıt yok</span>
              <span>· 1–299: Başlandı</span>
              <span>· 300–1.399: Güçlü</span>
              <span>· 1.400+: Tam Vird</span>
            </div>
          </section>

          {/* En Çok Yapılan Zikirler */}
          <section className="lg:col-span-6 rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
              En Çok Yapılan Zikirler
            </h2>
            <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
              Gerçek kullanıcı kayıtlarınıza göre sıralama
            </p>

            {stats.topDhikrs.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-[#D6A83D]/40 p-6 text-center text-sm text-[#546D62] dark:text-[#A9BFB4]">
                Henüz kayıtlı bir zikir tekrarı bulunmuyor. Ana sayfadan bir zikir
                seçerek saymaya başladığınızda istatistikleriniz burada otomatik
                olarak oluşacaktır.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {stats.topDhikrs.map((item, idx) => {
                  const widthPct = Math.max(
                    8,
                    Math.round((item.totalCount / maxTopCount) * 100)
                  );
                  return (
                    <div key={item.slug}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-[#06452F] dark:text-[#FFF4D8]">
                          {idx + 1}. {item.title}
                        </span>
                        <span className="font-semibold text-[#B58724] dark:text-[#E8C97A] tabular-nums">
                          {item.totalCount.toLocaleString('tr-TR')} tekrar
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#06452F]/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#06452F] dark:bg-[#D6A83D]"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
