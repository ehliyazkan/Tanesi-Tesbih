import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  type AppBackupPayload,
  type CustomDhikrInput,
  type CustomTargetsMap,
  DEFAULT_SETTINGS,
  getEffectiveDateInfo,
  getTargetForDhikr,
  incrementDhikrRecord,
  type RecordsByDate,
  type ReminderItem,
  resetDhikrRecord,
  type UserSettingsState,
  validateAndBuildCustomDhikr,
  validateBackupPayload,
} from '../utils/dhikrLogic';
import type { DhikrDefinition } from '../data/dhikrs';

const STORAGE_KEYS = {
  records: 'tanesi_records_v1',
  targets: 'tanesi_targets_v1',
  settings: 'tanesi_settings_v1',
  customDhikrs: 'tanesi_custom_dhikrs_v1',
};

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface TanesiContextValue {
  // Tarih ve gün bilgisi (gün başlangıç saatine göre otomatik güncellenir)
  todayDateKey: string;
  todayWeekday: number;
  displayDate: Date;

  // Zikir verileri
  records: RecordsByDate;
  customTargets: CustomTargetsMap;
  customDhikrs: DhikrDefinition[];
  settings: UserSettingsState;

  // Sayaç aksiyonları
  getTarget: (slug: string) => number;
  getCountOnDate: (slug: string, dateKey?: string) => number;
  incrementDhikr: (slug: string, delta?: number, dateKey?: string) => { nextCount: number; justCompleted: boolean };
  resetDhikr: (slug: string, dateKey?: string) => void;
  setTargetForDhikr: (slug: string, target: number) => void;
  saveCustomDhikr: (input: CustomDhikrInput, existingSlug?: string) => { ok: boolean; error?: string; dhikr?: DhikrDefinition };
  deleteCustomDhikr: (slug: string) => void;
  updateSettings: (patch: Partial<UserSettingsState>) => void;
  updateReminders: (reminders: ReminderItem[]) => void;

  // Yedekleme ve geri yükleme
  exportBackup: () => AppBackupPayload;
  importBackup: (raw: unknown) => { ok: boolean; error?: string };

  // Kullanıcı oturumu ve bulut senkronizasyonu
  user: User | null;
  authLoading: boolean;
  syncing: boolean;
  syncError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const TanesiContext = createContext<TanesiContextValue | null>(null);

export const TanesiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<RecordsByDate>(() =>
    readLocalJson<RecordsByDate>(STORAGE_KEYS.records, {})
  );
  const [customTargets, setCustomTargets] = useState<CustomTargetsMap>(() =>
    readLocalJson<CustomTargetsMap>(STORAGE_KEYS.targets, {})
  );
  const [customDhikrs, setCustomDhikrs] = useState<DhikrDefinition[]>(() =>
    readLocalJson<DhikrDefinition[]>(STORAGE_KEYS.customDhikrs, [])
  );
  const [settings, setSettings] = useState<UserSettingsState>(() => {
    const stored = readLocalJson<Partial<UserSettingsState>>(STORAGE_KEYS.settings, {});
    return {
      ...DEFAULT_SETTINGS,
      ...stored,
      reminders:
        Array.isArray(stored.reminders) && stored.reminders.length > 0
          ? stored.reminders
          : DEFAULT_SETTINGS.reminders,
    };
  });

  const [nowTick, setNowTick] = useState<Date>(() => new Date());
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Güncel state ref'leri (bulut senkronizasyonunda taze veri kullanmak için)
  const recordsRef = useRef(records);
  const targetsRef = useRef(customTargets);
  const customDhikrsRef = useRef(customDhikrs);
  const settingsRef = useRef(settings);
  recordsRef.current = records;
  targetsRef.current = customTargets;
  customDhikrsRef.current = customDhikrs;
  settingsRef.current = settings;

  // Tarih değişimini otomatik yakala (her 30 saniyede bir kontrol)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTick(new Date());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveDate = useMemo(
    () => getEffectiveDateInfo(nowTick, settings.dayStartHour),
    [nowTick, settings.dayStartHour]
  );

  // Tema ve yazı büyüklüğünü DOM'a uygula
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-font-size', settings.fontSize);
  }, [settings.theme, settings.fontSize]);

  // Yerel depolamaya kaydet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
    } catch {
      // Depolama doluysa sessizce geç
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.targets, JSON.stringify(customTargets));
    } catch {
      // Sessizce geç
    }
  }, [customTargets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Sessizce geç
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customDhikrs, JSON.stringify(customDhikrs));
    } catch {
      // Sessizce geç
    }
  }, [customDhikrs]);

  const authedFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.headers || {}),
      },
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Sunucu isteği başarısız oldu.');
    }
    return res.json();
  }, []);

  // Buluttan verileri çek ve yerel verilerle en yüksek değeri koruyarak birleştir
  const pullAndMergeFromCloud = useCallback(async () => {
    if (!auth.currentUser) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const data = await authedFetch('/api/state', { method: 'GET' });
      if (!data) return;

      const mergedRecords: RecordsByDate = { ...recordsRef.current };
      if (Array.isArray(data.records)) {
        for (const row of data.records) {
          const dk = row.recordDate as string;
          const slug = row.dhikrSlug as string;
          if (!mergedRecords[dk]) mergedRecords[dk] = {};
          const localCount = mergedRecords[dk][slug]?.count ?? 0;
          const remoteCount = typeof row.count === 'number' ? row.count : 0;
          if (remoteCount >= localCount) {
            mergedRecords[dk][slug] = {
              count: remoteCount,
              target: row.targetSnapshot ?? 100,
              updatedAt: row.updatedAt ?? new Date().toISOString(),
            };
          }
        }
      }

      const mergedTargets: CustomTargetsMap = { ...targetsRef.current };
      if (Array.isArray(data.targets)) {
        for (const t of data.targets) {
          if (typeof t.dhikrSlug === 'string' && typeof t.targetCount === 'number') {
            mergedTargets[t.dhikrSlug] = t.targetCount;
          }
        }
      }

      let mergedSettings = settingsRef.current;
      if (data.settings) {
        let parsedReminders = mergedSettings.reminders;
        try {
          const r = JSON.parse(data.settings.remindersJson || '[]');
          if (Array.isArray(r) && r.length > 0) parsedReminders = r;
        } catch {
          // Varsayılanları koru
        }
        mergedSettings = {
          soundEnabled: Boolean(data.settings.soundEnabled),
          vibrationEnabled: Boolean(data.settings.vibrationEnabled),
          fontSize:
            data.settings.fontSize === 'small' || data.settings.fontSize === 'large'
              ? data.settings.fontSize
              : 'medium',
          theme: data.settings.theme === 'dark' ? 'dark' : 'light',
          dayStartHour:
            typeof data.settings.dayStartHour === 'number' ? data.settings.dayStartHour : 0,
          reminders: parsedReminders,
        };
      }

      const mergedCustomMap = new Map<string, DhikrDefinition>();
      for (const item of customDhikrsRef.current) {
        mergedCustomMap.set(item.slug, item);
      }
      if (Array.isArray(data.customDhikrs)) {
        for (const row of data.customDhikrs) {
          if (typeof row.slug === 'string' && typeof row.title === 'string') {
            mergedCustomMap.set(row.slug, {
              slug: row.slug,
              category: 'custom',
              title: row.title,
              arabic: row.arabic || '',
              transliteration: row.transliteration || row.title,
              meaning: row.meaning || '',
              note: row.note || undefined,
              defaultTarget: typeof row.defaultTarget === 'number' ? row.defaultTarget : 100,
              targetOptions: [33, 99, 100, 300],
              sortOrder: 100,
            });
          }
        }
      }

      setRecords(mergedRecords);
      setCustomTargets(mergedTargets);
      setCustomDhikrs(Array.from(mergedCustomMap.values()));
      setSettings(mergedSettings);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Bulut verileri alınamadı.');
    } finally {
      setSyncing(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        pullAndMergeFromCloud().catch(() => {});
      }
    });
    return () => unsubscribe();
  }, [pullAndMergeFromCloud]);

  const getTarget = useCallback(
    (slug: string) => getTargetForDhikr(slug, customTargets, customDhikrs),
    [customTargets, customDhikrs]
  );

  const getCountOnDate = useCallback(
    (slug: string, dateKey?: string) => {
      const dk = dateKey ?? effectiveDate.dateKey;
      return records[dk]?.[slug]?.count ?? 0;
    },
    [records, effectiveDate.dateKey]
  );

  const syncRecordToCloud = useCallback(
    (slug: string, dateKey: string, count: number, targetSnapshot: number) => {
      if (!auth.currentUser) return;
      authedFetch('/api/records', {
        method: 'PUT',
        body: JSON.stringify({ dhikrSlug: slug, recordDate: dateKey, count, targetSnapshot }),
      }).catch(() => {});
    },
    [authedFetch]
  );

  const incrementDhikr = useCallback(
    (slug: string, delta: number = 1, dateKey?: string) => {
      const dk = dateKey ?? effectiveDate.dateKey;
      const target = getTargetForDhikr(slug, targetsRef.current, customDhikrsRef.current);
      const { nextRecords, nextCount, justCompleted } = incrementDhikrRecord(
        recordsRef.current,
        dk,
        slug,
        target,
        delta
      );
      setRecords(nextRecords);
      syncRecordToCloud(slug, dk, nextCount, target);
      return { nextCount, justCompleted };
    },
    [effectiveDate.dateKey, syncRecordToCloud]
  );

  const resetDhikr = useCallback(
    (slug: string, dateKey?: string) => {
      const dk = dateKey ?? effectiveDate.dateKey;
      const target = getTargetForDhikr(slug, targetsRef.current, customDhikrsRef.current);
      const nextRecords = resetDhikrRecord(recordsRef.current, dk, slug, target);
      setRecords(nextRecords);
      syncRecordToCloud(slug, dk, 0, target);
    },
    [effectiveDate.dateKey, syncRecordToCloud]
  );

  const setTargetForDhikr = useCallback(
    (slug: string, target: number) => {
      const safeTarget = Math.max(1, Math.min(100000, Math.floor(target)));
      setCustomTargets((prev) => ({ ...prev, [slug]: safeTarget }));
      if (auth.currentUser) {
        authedFetch('/api/targets', {
          method: 'PUT',
          body: JSON.stringify({ dhikrSlug: slug, targetCount: safeTarget }),
        }).catch(() => {});
      }
    },
    [authedFetch]
  );

  const saveCustomDhikr = useCallback(
    (input: CustomDhikrInput, existingSlug?: string) => {
      const result = validateAndBuildCustomDhikr(input, existingSlug);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      const saved = result.dhikr;
      setCustomDhikrs((prev) => {
        const idx = prev.findIndex((item) => item.slug === saved.slug);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = saved;
          return copy;
        }
        return [saved, ...prev];
      });
      // Kullanıcının girdiği hedefi hedefler haritasında da eşitle
      setCustomTargets((prev) => ({ ...prev, [saved.slug]: saved.defaultTarget }));

      if (auth.currentUser) {
        authedFetch('/api/custom-dhikrs', {
          method: 'POST',
          body: JSON.stringify({
            slug: saved.slug,
            title: saved.title,
            arabic: saved.arabic,
            transliteration: saved.transliteration,
            meaning: saved.meaning,
            note: saved.note ?? '',
            defaultTarget: saved.defaultTarget,
          }),
        }).catch(() => {});
      }
      return { ok: true, dhikr: saved };
    },
    [authedFetch]
  );

  const deleteCustomDhikr = useCallback(
    (slug: string) => {
      setCustomDhikrs((prev) => prev.filter((item) => item.slug !== slug));
      if (auth.currentUser) {
        authedFetch(`/api/custom-dhikrs/${encodeURIComponent(slug)}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    },
    [authedFetch]
  );

  const updateSettings = useCallback(
    (patch: Partial<UserSettingsState>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (auth.currentUser) {
          authedFetch('/api/settings', {
            method: 'PUT',
            body: JSON.stringify({
              ...next,
              remindersJson: JSON.stringify(next.reminders),
            }),
          }).catch(() => {});
        }
        return next;
      });
    },
    [authedFetch]
  );

  const updateReminders = useCallback(
    (reminders: ReminderItem[]) => {
      updateSettings({ reminders });
    },
    [updateSettings]
  );

  const exportBackup = useCallback((): AppBackupPayload => {
    return {
      app: 'TANESI',
      version: 1,
      exportedAt: new Date().toISOString(),
      targets: customTargets,
      records,
      settings,
      customDhikrs,
    };
  }, [customTargets, records, settings, customDhikrs]);

  const importBackup = useCallback(
    (raw: unknown): { ok: boolean; error?: string } => {
      const validated = validateBackupPayload(raw);
      if (!validated.ok) {
        return { ok: false, error: validated.error };
      }
      setCustomTargets(validated.data.targets);
      setRecords(validated.data.records);
      setSettings(validated.data.settings);
      if (Array.isArray(validated.data.customDhikrs)) {
        setCustomDhikrs(validated.data.customDhikrs);
      }
      if (auth.currentUser) {
        authedFetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify({
            targets: validated.data.targets,
            records: validated.data.records,
            settings: validated.data.settings,
            customDhikrs: validated.data.customDhikrs ?? [],
          }),
        }).catch(() => {});
      }
      return { ok: true };
    },
    [authedFetch]
  );

  const signInWithGoogle = useCallback(async () => {
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Google ile oturum açılamadı.');
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const syncNow = useCallback(async () => {
    if (!auth.currentUser) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await authedFetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify({
          targets: targetsRef.current,
          records: recordsRef.current,
          settings: settingsRef.current,
          customDhikrs: customDhikrsRef.current,
        }),
      });
      await pullAndMergeFromCloud();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Senkronizasyon tamamlanamadı.');
    } finally {
      setSyncing(false);
    }
  }, [authedFetch, pullAndMergeFromCloud]);

  const value = useMemo<TanesiContextValue>(
    () => ({
      todayDateKey: effectiveDate.dateKey,
      todayWeekday: effectiveDate.weekday,
      displayDate: effectiveDate.displayDate,
      records,
      customTargets,
      customDhikrs,
      settings,
      getTarget,
      getCountOnDate,
      incrementDhikr,
      resetDhikr,
      setTargetForDhikr,
      saveCustomDhikr,
      deleteCustomDhikr,
      updateSettings,
      updateReminders,
      exportBackup,
      importBackup,
      user,
      authLoading,
      syncing,
      syncError,
      signInWithGoogle,
      signOutUser,
      syncNow,
    }),
    [
      effectiveDate,
      records,
      customTargets,
      customDhikrs,
      settings,
      getTarget,
      getCountOnDate,
      incrementDhikr,
      resetDhikr,
      setTargetForDhikr,
      saveCustomDhikr,
      deleteCustomDhikr,
      updateSettings,
      updateReminders,
      exportBackup,
      importBackup,
      user,
      authLoading,
      syncing,
      syncError,
      signInWithGoogle,
      signOutUser,
      syncNow,
    ]
  );

  return <TanesiContext.Provider value={value}>{children}</TanesiContext.Provider>;
};

export function useTanesi() {
  const ctx = useContext(TanesiContext);
  if (!ctx) {
    throw new Error('useTanesi must be used within TanesiProvider');
  }
  return ctx;
}
