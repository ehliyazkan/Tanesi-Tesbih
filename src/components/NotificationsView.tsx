import React, { useState } from 'react';
import { Bell, BellRing, Plus, Trash2 } from 'lucide-react';
import { useTanesi } from '../context/TanesiContext';
import type { ReminderItem } from '../utils/dhikrLogic';
import { WEEKDAY_SHORT_TR, WEEKDAY_ORDER } from '../data/dhikrs';

export const NotificationsView: React.FC = () => {
  const { settings, updateReminders } = useTanesi();

  const [permissionState, setPermissionState] = useState<string>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  });

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDesc, setNewDesc] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissionState('unsupported');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
    } catch {
      setPermissionState('denied');
    }
  };

  const toggleReminder = (id: string) => {
    const next = settings.reminders.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    updateReminders(next);
  };

  const updateReminderTime = (id: string, time: string) => {
    const next = settings.reminders.map((r) =>
      r.id === id ? { ...r, time } : r
    );
    updateReminders(next);
  };

  const toggleReminderDay = (id: string, dayNum: number) => {
    const next = settings.reminders.map((r) => {
      if (r.id !== id) return r;
      const exists = r.days.includes(dayNum);
      const days = exists ? r.days.filter((d) => d !== dayNum) : [...r.days, dayNum];
      return { ...r, days };
    });
    updateReminders(next);
  };

  const deleteReminder = (id: string) => {
    updateReminders(settings.reminders.filter((r) => r.id !== id));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      setFormError('Lütfen hatırlatma için bir başlık yazın.');
      return;
    }
    setFormError(null);
    const created: ReminderItem = {
      id: `rem-${Date.now()}`,
      title: trimmed,
      time: newTime || '09:00',
      enabled: true,
      days: [],
      description: newDesc.trim() || 'Zikir ve tesbih vakti hatırlatması.',
    };
    updateReminders([...settings.reminders, created]);
    setNewTitle('');
    setNewDesc('');
  };

  const triggerPreview = (rem: ReminderItem) => {
    const msg = `${rem.title} (${rem.time}) — ${rem.description}`;
    setPreviewMessage(msg);
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(`TANESİ · ${rem.title}`, {
          body: rem.description,
          icon: '/pwa-192x192.png',
        });
      } catch {
        // Tarayıcı içi önizleme bandı zaten gösteriliyor
      }
    }
  };

  return (
    <div className="pb-28">
      <header className="border-b border-[#D6A83D]/35 bg-[#06452F] text-[#FFF4D8]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold">
              Hatırlatma Bildirimleri
            </h1>
            <p className="mt-1 text-sm text-[#E8C97A]/90">
              Günlük vird ve haftalık tesbih vakitlerinizi düzenli olarak planlayın
            </p>
          </div>

          {permissionState === 'default' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#D6A83D] px-4 py-2 text-sm font-semibold text-[#063222] hover:bg-[#E3BA58] transition-colors whitespace-nowrap"
            >
              <BellRing className="w-4 h-4" />
              <span>Tarayıcı Bildirimlerine İzin Ver</span>
            </button>
          )}
          {permissionState === 'granted' && (
            <span className="text-xs font-medium text-[#E8C97A]">
              Sistem bildirimleri etkin
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-7 space-y-6">
        {previewMessage && (
          <div
            role="status"
            className="flex items-center justify-between gap-4 rounded-2xl border border-[#D6A83D] bg-[#FFF4D8] dark:bg-[#113527] px-5 py-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8]"
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-[#B58724] dark:text-[#D6A83D] shrink-0" />
              <span>{previewMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setPreviewMessage(null)}
              className="text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] hover:underline whitespace-nowrap"
            >
              Kapat
            </button>
          </div>
        )}

        {/* Mevcut Hatırlatmalar */}
        <section aria-labelledby="reminders-list-heading" className="space-y-3.5">
          <h2
            id="reminders-list-heading"
            className="font-display text-2xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
          >
            Planlı Hatırlatmalar
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.reminders.map((rem) => (
              <article
                key={rem.id}
                className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                        {rem.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-[#546D62] dark:text-[#A9BFB4]">
                        {rem.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={rem.enabled}
                      aria-label={`${rem.title} hatırlatmasını ${rem.enabled ? 'kapat' : 'aç'}`}
                      onClick={() => toggleReminder(rem.id)}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                        rem.enabled
                          ? 'bg-[#06452F] dark:bg-[#D6A83D]'
                          : 'bg-[#06452F]/20 dark:bg-white/15'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          rem.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Saat seçici ve günler */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label
                      htmlFor={`time-${rem.id}`}
                      className="text-xs font-medium text-[#4A6358] dark:text-[#C5D8CE]"
                    >
                      Saat:
                    </label>
                    <input
                      id={`time-${rem.id}`}
                      type="time"
                      value={rem.time}
                      onChange={(e) => updateReminderTime(rem.id, e.target.value)}
                      className="min-h-[38px] rounded-lg border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-2.5 text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
                    />
                    <span className="text-xs text-[#546D62] dark:text-[#A9BFB4]">
                      {rem.days.length === 0 ? 'Her gün' : 'Seçili günler'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {WEEKDAY_ORDER.map((dayNum) => {
                      const active = rem.days.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => toggleReminderDay(rem.id, dayNum)}
                          className={`min-h-[32px] px-2 rounded-lg text-[11px] font-medium border transition-colors ${
                            active
                              ? 'bg-[#06452F] text-[#FFF4D8] border-[#D6A83D]'
                              : 'border-[#D6A83D]/30 text-[#4A6358] dark:text-[#A9BFB4] hover:border-[#D6A83D]'
                          }`}
                        >
                          {WEEKDAY_SHORT_TR[dayNum]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#D6A83D]/20 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => triggerPreview(rem)}
                    className="min-h-[38px] text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] hover:underline"
                  >
                    Hatırlatma Önizle
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteReminder(rem.id)}
                    aria-label={`${rem.title} hatırlatmasını sil`}
                    className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#8A2E2E] dark:text-[#F09A9A] hover:bg-[#8A2E2E]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Yeni Hatırlatma Ekle */}
        <section
          aria-labelledby="add-reminder-heading"
          className="rounded-2xl border border-[#D6A83D]/40 bg-[#FFF9EB] dark:bg-[#0B261C] p-5 sm:p-6"
        >
          <h2
            id="add-reminder-heading"
            className="font-display text-xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
          >
            Yeni Hatırlatma Ekle
          </h2>

          <form onSubmit={handleAddReminder} className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label
                htmlFor="new-reminder-title"
                className="block text-xs font-medium text-[#4A6358] dark:text-[#C5D8CE] mb-1.5"
              >
                Hatırlatma Başlığı
              </label>
              <input
                id="new-reminder-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Örn. Yatsı Sonrası Tesbih"
                className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/45 bg-white dark:bg-[#071D15] px-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8]"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="new-reminder-time"
                className="block text-xs font-medium text-[#4A6358] dark:text-[#C5D8CE] mb-1.5"
              >
                Saat
              </label>
              <input
                id="new-reminder-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/45 bg-white dark:bg-[#071D15] px-3 text-sm text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
              />
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="new-reminder-desc"
                className="block text-xs font-medium text-[#4A6358] dark:text-[#C5D8CE] mb-1.5"
              >
                Kısa Not (İsteğe bağlı)
              </label>
              <input
                id="new-reminder-desc"
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Örn. 100 İstiğfar ve Salât-ı Şerife"
                className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/45 bg-white dark:bg-[#071D15] px-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8]"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#06452F] px-4 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-[#E8C97A]" />
                <span>Ekle</span>
              </button>
            </div>
          </form>

          {formError && (
            <p role="alert" className="mt-2.5 text-xs font-medium text-[#9E2A2B] dark:text-[#F09A9A]">
              {formError}
            </p>
          )}
        </section>
      </main>
    </div>
  );
};
