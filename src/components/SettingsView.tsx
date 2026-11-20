import React, { useRef, useState } from 'react';
import {
  Cloud,
  Download,
  LogIn,
  LogOut,
  Moon,
  RefreshCw,
  Sun,
  Upload,
  Vibrate,
  Volume2,
} from 'lucide-react';
import { DAILY_DHIKRS, ADDITIONAL_DHIKRS, SPECIAL_DHIKRS } from '../data/dhikrs';
import { useTanesi } from '../context/TanesiContext';
import type { FontSizeOption } from '../utils/dhikrLogic';
import { playBeadClickSound, triggerHaptic } from '../utils/feedback';
import { PWAInstallButton } from './OrnamentPrimitives';

const DAY_START_OPTIONS = [
  { hour: 0, label: '00:00 — Gece Yarısı' },
  { hour: 3, label: '03:00 — Seher Vakti' },
  { hour: 4, label: '04:00 — İmsak / Fecr' },
  { hour: 5, label: '05:00 — Sabah Başlangıcı' },
  { hour: 6, label: '06:00 — Gün Doğumu' },
];

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    getTarget,
    setTargetForDhikr,
    exportBackup,
    importBackup,
    todayDateKey,
    user,
    authLoading,
    syncing,
    syncError,
    signInWithGoogle,
    signOutUser,
    syncNow,
  } = useTanesi();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupMessage, setBackupMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleExportJson = () => {
    const payload = exportBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tanesi-yedek-${todayDateKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupMessage({
      type: 'success',
      text: 'Yedek dosyası cihazınıza indirildi.',
    });
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = importBackup(parsed);
      if (res.ok) {
        setBackupMessage({
          type: 'success',
          text: 'Yedek dosyanız başarıyla geri yüklendi.',
        });
      } else {
        setBackupMessage({
          type: 'error',
          text: res.error || 'Yedek dosyası doğrulanamadı.',
        });
      }
    } catch {
      setBackupMessage({
        type: 'error',
        text: 'Seçilen dosya geçerli bir JSON yedek dosyası değil.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetDefaultTargets = () => {
    [...DAILY_DHIKRS, ...ADDITIONAL_DHIKRS, ...SPECIAL_DHIKRS].forEach((d) => {
      setTargetForDhikr(d.slug, d.defaultTarget);
    });
  };

  const fontSizeOptions: Array<{ value: FontSizeOption; label: string }> = [
    { value: 'small', label: 'Küçük' },
    { value: 'medium', label: 'Orta' },
    { value: 'large', label: 'Büyük' },
  ];

  return (
    <div className="pb-28">
      <header className="border-b border-[#D6A83D]/35 bg-[#06452F] text-[#FFF4D8]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Ayarlar
            </h1>
            <p className="mt-1 text-sm text-[#E8C97A]/90">
              Günlük hedefler, tema, yazı büyüklüğü, ses/titreşim ve veri yedekleme
            </p>
          </div>
          <PWAInstallButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-7 space-y-6">
        {/* Hesap ve Bulut Senkronizasyonu */}
        <section className="rounded-2xl border border-[#D6A83D]/40 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#06452F] text-[#E8C97A] flex items-center justify-center shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
                  Hesap ve Bulut Eşitleme
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-[#546D62] dark:text-[#A9BFB4]">
                  {user
                    ? `${user.email || user.displayName} hesabı ile kayıtlarınız güvenle eşitleniyor.`
                    : 'Zikirleriniz cihazınızda otomatik saklanır. Dilerseniz Google hesabınızla giriş yaparak cihazlar arası eşitleme açabilirsiniz.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {authLoading ? (
                <span className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
                  Kontrol ediliyor...
                </span>
              ) : user ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      syncNow().catch(() => {});
                    }}
                    disabled={syncing}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-[#D6A83D]/50 px-3.5 text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] hover:bg-[#D6A83D]/10 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Eşitleniyor...' : 'Şimdi Eşitle'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      signOutUser().catch(() => {});
                    }}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl border border-[#8A2E2E]/35 px-3.5 text-xs font-semibold text-[#8A2E2E] dark:text-[#F09A9A] hover:bg-[#8A2E2E]/10 transition-colors whitespace-nowrap"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Çıkış Yap</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    signInWithGoogle().catch(() => {});
                  }}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#06452F] px-4 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4 text-[#E8C97A]" />
                  <span>Google ile Giriş Yap</span>
                </button>
              )}
            </div>
          </div>

          {syncError && (
            <p role="alert" className="mt-3 text-xs font-medium text-[#9E2A2B] dark:text-[#F09A9A]">
              {syncError}
            </p>
          )}
        </section>

        {/* Görünüm, Ses, Titreşim ve Gün Başlangıcı */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sayaç Geri Bildirimi */}
          <section className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6 space-y-5">
            <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
              Sayaç Geri Bildirimi
            </h2>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-[#06452F] dark:text-[#E8C97A]" />
                <div>
                  <p className="text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                    Sayaç Sesi
                  </p>
                  <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
                    Her dokunuşta hafif ahşap tesbih sesi ve tamamlama tınısı
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.soundEnabled}
                aria-label="Sayaç sesini aç veya kapat"
                onClick={() => {
                  const next = !settings.soundEnabled;
                  updateSettings({ soundEnabled: next });
                  if (next) playBeadClickSound();
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  settings.soundEnabled
                    ? 'bg-[#06452F] dark:bg-[#D6A83D]'
                    : 'bg-[#06452F]/20 dark:bg-white/15'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-[#D6A83D]/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-[#06452F] dark:text-[#E8C97A]" />
                <div>
                  <p className="text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                    Titreşim Geri Bildirimi
                  </p>
                  <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
                    Mobil cihazlarda dokunsal geri bildirim
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.vibrationEnabled}
                aria-label="Titreşimi aç veya kapat"
                onClick={() => {
                  const next = !settings.vibrationEnabled;
                  updateSettings({ vibrationEnabled: next });
                  if (next) triggerHaptic(22);
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                  settings.vibrationEnabled
                    ? 'bg-[#06452F] dark:bg-[#D6A83D]'
                    : 'bg-[#06452F]/20 dark:bg-white/15'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    settings.vibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-4 border-t border-[#D6A83D]/20">
              <label
                htmlFor="day-start-hour"
                className="block text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8]"
              >
                Gün Başlangıç Saati
              </label>
              <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                Yeni günlük vird kaydının ve haftanın tesbihinin ne zaman yenileneceğini belirler
              </p>
              <select
                id="day-start-hour"
                value={settings.dayStartHour}
                onChange={(e) =>
                  updateSettings({ dayStartHour: Number(e.target.value) })
                }
                className="mt-2.5 w-full min-h-[44px] rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8]"
              >
                {DAY_START_OPTIONS.map((opt) => (
                  <option key={opt.hour} value={opt.hour}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Görünüm ve Yazı Büyüklüğü */}
          <section className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6 space-y-5">
            <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
              Görünüm ve Tipografi
            </h2>

            {/* Tema Seçimi */}
            <div>
              <p className="text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8] mb-2.5">
                Tema Modu
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'light' })}
                  aria-pressed={settings.theme === 'light'}
                  className={`min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                    settings.theme === 'light'
                      ? 'border-[#D6A83D] bg-[#06452F] text-[#FFF4D8]'
                      : 'border-[#D6A83D]/35 bg-[#F8EED8]/60 dark:bg-[#071D15] text-[#06452F] dark:text-[#C5D8CE]'
                  }`}
                >
                  <Sun className="w-4 h-4 text-[#D6A83D]" />
                  <span>Açık Parşömen</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'dark' })}
                  aria-pressed={settings.theme === 'dark'}
                  className={`min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-[#D6A83D] bg-[#06452F] text-[#FFF4D8]'
                      : 'border-[#D6A83D]/35 bg-[#F8EED8]/60 dark:bg-[#071D15] text-[#06452F] dark:text-[#C5D8CE]'
                  }`}
                >
                  <Moon className="w-4 h-4 text-[#D6A83D]" />
                  <span>Koyu Zümrüt</span>
                </button>
              </div>
            </div>

            {/* Yazı Büyüklüğü */}
            <div className="pt-4 border-t border-[#D6A83D]/20">
              <p className="text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8] mb-2.5">
                Yazı ve Arapça Hat Büyüklüğü
              </p>
              <div className="grid grid-cols-3 gap-2">
                {fontSizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateSettings({ fontSize: opt.value })}
                    aria-pressed={settings.fontSize === opt.value}
                    className={`min-h-[44px] rounded-xl border text-sm font-medium transition-colors ${
                      settings.fontSize === opt.value
                        ? 'border-[#D6A83D] bg-[#06452F] text-[#FFF4D8]'
                        : 'border-[#D6A83D]/35 bg-[#F8EED8]/60 dark:bg-[#071D15] text-[#06452F] dark:text-[#C5D8CE]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-[#D6A83D]/25 bg-[#F8EED8]/55 dark:bg-[#071D15] p-3 text-center">
                <p className="font-arabic arabic-md text-[#06452F] dark:text-[#FFF4D8]" dir="rtl" lang="ar">
                  سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ
                </p>
                <p className="text-xs text-[#4A6358] dark:text-[#C5D8CE] body-scaled">
                  Örnek görünüm: Sübhânallahi ve bihamdihî
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Günlük Hedefler */}
        <section className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
                Günlük Hedefler
              </h2>
              <p className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
                Günlük vird ve özel zikirlerinizin tekrar hedeflerini kişiselleştirin
              </p>
            </div>
            <button
              type="button"
              onClick={resetDefaultTargets}
              className="min-h-[38px] px-3 rounded-lg border border-[#D6A83D]/45 text-xs font-medium text-[#06452F] dark:text-[#E8C97A] hover:bg-[#D6A83D]/10 transition-colors"
            >
              Varsayılan Hedeflere Dön
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[...DAILY_DHIKRS, ...SPECIAL_DHIKRS].map((dhikr) => {
              const target = getTarget(dhikr.slug);
              return (
                <div
                  key={dhikr.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#D6A83D]/25 bg-[#F8EED8]/55 dark:bg-[#071D15] px-4 py-3"
                >
                  <label
                    htmlFor={`target-${dhikr.slug}`}
                    className="text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] truncate"
                  >
                    {dhikr.title}
                  </label>
                  <input
                    id={`target-${dhikr.slug}`}
                    type="number"
                    min={1}
                    max={100000}
                    value={target}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v) && v >= 1) {
                        setTargetForDhikr(dhikr.slug, v);
                      }
                    }}
                    className="w-24 min-h-[40px] rounded-lg border border-[#D6A83D]/50 bg-white dark:bg-[#0B261C] px-2.5 text-right text-sm font-semibold text-[#06452F] dark:text-[#E8C97A] tabular-nums"
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Veri Yedekleme ve Geri Yükleme */}
        <section className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]">
            Verileri Yedekleme ve Geri Yükleme
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#546D62] dark:text-[#A9BFB4]">
            Tüm günlük zikir geçmişinizi, hedeflerinizi ve ayarlarınızı JSON dosyası olarak dışa aktarın veya mevcut yedeğinizden geri yükleyin.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#06452F] px-4 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#E8C97A]" />
              <span>Yedeği İndir (JSON)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
              className="hidden"
              id="backup-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#D6A83D]/60 bg-transparent px-4 text-sm font-medium text-[#06452F] dark:text-[#E8C97A] hover:bg-[#D6A83D]/10 transition-colors whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Yedekten Geri Yükle</span>
            </button>
          </div>

          {backupMessage && (
            <p
              role="status"
              className={`mt-3 text-xs font-medium ${
                backupMessage.type === 'success'
                  ? 'text-[#0B593D] dark:text-[#E8C97A]'
                  : 'text-[#9E2A2B] dark:text-[#F09A9A]'
              }`}
            >
              {backupMessage.text}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};
