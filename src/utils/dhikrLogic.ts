import {
  DAILY_DHIKRS,
  DHIKR_CATALOG,
  WEEKLY_DHIKRS,
  WEEKDAY_ORDER,
  getDhikrBySlug,
  type DhikrDefinition,
} from '../data/dhikrs';

export type FontSizeOption = 'small' | 'medium' | 'large';
export type ThemeOption = 'light' | 'dark';

export interface ReminderItem {
  id: string;
  title: string;
  time: string; // HH:MM
  enabled: boolean;
  days: number[]; // 0..6 (empty = her gün)
  description: string;
}

export interface UserSettingsState {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  fontSize: FontSizeOption;
  theme: ThemeOption;
  dayStartHour: number; // 0..23
  reminders: ReminderItem[];
}

export interface DailyEntry {
  count: number;
  target: number;
  updatedAt: string;
}

// recordDate (YYYY-MM-DD) -> dhikrSlug -> DailyEntry
export type RecordsByDate = Record<string, Record<string, DailyEntry>>;
export type CustomTargetsMap = Record<string, number>;

export interface CustomDhikrInput {
  title: string;
  arabic?: string;
  transliteration?: string;
  meaning?: string;
  note?: string;
  defaultTarget: number;
}

export interface AppBackupPayload {
  app: 'TANESI';
  version: 1;
  exportedAt: string;
  targets: CustomTargetsMap;
  records: RecordsByDate;
  settings: UserSettingsState;
  customDhikrs?: DhikrDefinition[];
}

export function validateAndBuildCustomDhikr(
  input: CustomDhikrInput,
  existingSlug?: string
): { ok: true; dhikr: DhikrDefinition } | { ok: false; error: string } {
  const title = (input.title ?? '').trim();
  const arabic = (input.arabic ?? '').trim();
  const transliteration = (input.transliteration ?? '').trim();
  const meaning = (input.meaning ?? '').trim();
  const note = (input.note ?? '').trim();
  const target = Number(input.defaultTarget);

  if (!title) {
    return { ok: false, error: 'Lütfen tesbih için bir ad girin.' };
  }
  if (title.length > 120) {
    return { ok: false, error: 'Tesbih adı en fazla 120 karakter olabilir.' };
  }
  if (!arabic && !transliteration) {
    return {
      ok: false,
      error: 'Lütfen en azından Arapça metin veya Türkçe okunuş bilgisini girin.',
    };
  }
  if (!Number.isFinite(target) || target < 1 || target > 100000) {
    return {
      ok: false,
      error: 'Hedef tekrar sayısı 1 ile 100.000 arasında olmalıdır.',
    };
  }

  const slug =
    existingSlug && existingSlug.startsWith('custom-')
      ? existingSlug
      : `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    ok: true,
    dhikr: {
      slug,
      category: 'custom',
      title,
      arabic,
      transliteration: transliteration || title,
      meaning,
      note: note || undefined,
      defaultTarget: Math.floor(target),
      targetOptions: [33, 99, 100, 300],
      sortOrder: 100,
    },
  };
}

export const DEFAULT_REMINDERS: ReminderItem[] = [
  {
    id: 'rem-sabah',
    title: 'Sabah Virdi',
    time: '06:30',
    enabled: true,
    days: [],
    description: 'Güne İstiğfar ve Salât-ı Şerife ile huzurlu başlangıç.',
  },
  {
    id: 'rem-ogle',
    title: 'Günün Haftalık Tesbihi',
    time: '13:15',
    enabled: true,
    days: [],
    description: 'Bulunduğunuz güne özel 100 tekrar tesbih hatırlatması.',
  },
  {
    id: 'rem-aksam',
    title: 'Akşam Zikri',
    time: '20:30',
    enabled: true,
    days: [],
    description: 'Günlük virdlerinizi tamamlamak için akşam vakti hatırlatması.',
  },
  {
    id: 'rem-cuma',
    title: 'Cuma Tesbihi',
    time: '11:30',
    enabled: true,
    days: [5],
    description: 'Cuma gününe mahsus Bâkıyât-ı Sâlihât tesbihi.',
  },
];

export const DEFAULT_SETTINGS: UserSettingsState = {
  soundEnabled: true,
  vibrationEnabled: true,
  fontSize: 'medium',
  theme: 'light',
  dayStartHour: 0,
  reminders: DEFAULT_REMINDERS,
};

/**
 * Kullanıcının seçtiği gün başlangıç saatine göre etkin tarih anahtarını (YYYY-MM-DD)
 * ve haftanın gününü (0=Pazar..6=Cumartesi) döndürür.
 */
export function getEffectiveDateInfo(
  now: Date = new Date(),
  dayStartHour: number = 0
): { dateKey: string; weekday: number; displayDate: Date } {
  const safeHour = Math.max(0, Math.min(23, Math.floor(dayStartHour)));
  const shifted = new Date(now.getTime());
  if (shifted.getHours() < safeHour) {
    shifted.setDate(shifted.getDate() - 1);
  }
  const year = shifted.getFullYear();
  const month = String(shifted.getMonth() + 1).padStart(2, '0');
  const day = String(shifted.getDate()).padStart(2, '0');
  return {
    dateKey: `${year}-${month}-${day}`,
    weekday: shifted.getDay(),
    displayDate: shifted,
  };
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getTargetForDhikr(
  slug: string,
  customTargets: CustomTargetsMap,
  customDhikrs: DhikrDefinition[] = []
): number {
  const custom = customTargets[slug];
  if (typeof custom === 'number' && Number.isFinite(custom) && custom >= 1) {
    return Math.floor(custom);
  }
  const fromCatalog = getDhikrBySlug(slug);
  if (fromCatalog) return fromCatalog.defaultTarget;
  const fromCustom = customDhikrs.find((d) => d.slug === slug);
  return fromCustom?.defaultTarget ?? 100;
}

export function getCountForDhikrOnDate(
  records: RecordsByDate,
  dateKey: string,
  slug: string
): number {
  return records[dateKey]?.[slug]?.count ?? 0;
}

export function calculateProgressPercent(count: number, target: number): number {
  if (target <= 0) return 0;
  const pct = Math.round((Math.max(0, count) / target) * 100);
  return Math.min(100, pct);
}

export function incrementDhikrRecord(
  records: RecordsByDate,
  dateKey: string,
  slug: string,
  target: number,
  delta: number = 1,
  nowIso: string = new Date().toISOString()
): { nextRecords: RecordsByDate; nextCount: number; justCompleted: boolean } {
  const dayMap = records[dateKey] ?? {};
  const prevCount = dayMap[slug]?.count ?? 0;
  const nextCount = Math.max(0, prevCount + delta);
  const justCompleted = prevCount < target && nextCount >= target;

  const nextRecords: RecordsByDate = {
    ...records,
    [dateKey]: {
      ...dayMap,
      [slug]: {
        count: nextCount,
        target,
        updatedAt: nowIso,
      },
    },
  };

  return { nextRecords, nextCount, justCompleted };
}

export function resetDhikrRecord(
  records: RecordsByDate,
  dateKey: string,
  slug: string,
  target: number,
  nowIso: string = new Date().toISOString()
): RecordsByDate {
  const dayMap = records[dateKey] ?? {};
  return {
    ...records,
    [dateKey]: {
      ...dayMap,
      [slug]: {
        count: 0,
        target,
        updatedAt: nowIso,
      },
    },
  };
}

/**
 * Günlük 5 temel virdin toplam ilerlemesini hesaplar (varsayılan 1.400 tekrar).
 */
export function getDailyVirdsSummary(
  records: RecordsByDate,
  dateKey: string,
  customTargets: CustomTargetsMap
): {
  completedRepeats: number;
  cappedRepeats: number;
  totalTarget: number;
  completedVirdCount: number;
  totalVirdCount: number;
  percentage: number;
} {
  let completedRepeats = 0;
  let cappedRepeats = 0;
  let totalTarget = 0;
  let completedVirdCount = 0;

  for (const item of DAILY_DHIKRS) {
    const target = getTargetForDhikr(item.slug, customTargets);
    const count = getCountForDhikrOnDate(records, dateKey, item.slug);
    totalTarget += target;
    completedRepeats += count;
    cappedRepeats += Math.min(count, target);
    if (count >= target) {
      completedVirdCount += 1;
    }
  }

  return {
    completedRepeats,
    cappedRepeats,
    totalTarget,
    completedVirdCount,
    totalVirdCount: DAILY_DHIKRS.length,
    percentage: calculateProgressPercent(cappedRepeats, totalTarget),
  };
}

/**
 * Belirli bir güne ait TÜM zikir kategorilerindeki toplam tekrar sayısını döndürür.
 */
export function getDayTotalRepeats(records: RecordsByDate, dateKey: string): number {
  const dayMap = records[dateKey];
  if (!dayMap) return 0;
  return Object.values(dayMap).reduce((sum, entry) => sum + (entry?.count ?? 0), 0);
}

/**
 * Pazartesi başlangıçlı mevcut haftanın 7 tarih anahtarını (YYYY-MM-DD) döndürür.
 */
export function getCurrentWeekDates(todayDateKey: string): Array<{
  dateKey: string;
  weekday: number;
}> {
  const base = parseDateKey(todayDateKey);
  const jsDay = base.getDay(); // 0=Sun..6=Sat
  const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(base.getFullYear(), base.getMonth(), base.getDate() + diffToMonday);

  return WEEKDAY_ORDER.map((weekday, idx) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + idx);
    return {
      dateKey: formatDateKey(d),
      weekday,
    };
  });
}

export interface StatisticsSnapshot {
  todayTotalRepeats: number;
  todayDailyVirdSummary: ReturnType<typeof getDailyVirdsSummary>;
  weeklyTotalRepeats: number;
  monthlyTotalRepeats: number;
  weeklySeries: Array<{
    dateKey: string;
    weekday: number;
    total: number;
    isToday: boolean;
  }>;
  weeklyTesbihStatus: Array<{
    weekday: number;
    slug: string;
    title: string;
    dateKey: string;
    count: number;
    target: number;
    completed: boolean;
    isToday: boolean;
  }>;
  continuityCalendar: Array<{
    dateKey: string;
    dayNumber: number;
    total: number;
    level: 0 | 1 | 2 | 3;
    isToday: boolean;
  }>;
  currentStreakDays: number;
  topDhikrs: Array<{
    slug: string;
    title: string;
    category: string;
    totalCount: number;
  }>;
}

export function computeStatistics(
  records: RecordsByDate,
  todayDateKey: string,
  customTargets: CustomTargetsMap,
  customDhikrs: DhikrDefinition[] = []
): StatisticsSnapshot {
  const todayTotalRepeats = getDayTotalRepeats(records, todayDateKey);
  const todayDailyVirdSummary = getDailyVirdsSummary(records, todayDateKey, customTargets);

  // Bu haftanın 7 günü (Pazartesi - Pazar)
  const weekDates = getCurrentWeekDates(todayDateKey);
  const weeklySeries = weekDates.map(({ dateKey, weekday }) => ({
    dateKey,
    weekday,
    total: getDayTotalRepeats(records, dateKey),
    isToday: dateKey === todayDateKey,
  }));
  const weeklyTotalRepeats = weeklySeries.reduce((sum, item) => sum + item.total, 0);

  // Haftalık tesbih başarı durumu (her günün özel haftalık zikri kendi gününde)
  const weeklyTesbihStatus = weekDates.map(({ dateKey, weekday }) => {
    const def = WEEKLY_DHIKRS.find((d) => d.weekday === weekday) ?? WEEKLY_DHIKRS[0];
    const target = getTargetForDhikr(def.slug, customTargets);
    const count = getCountForDhikrOnDate(records, dateKey, def.slug);
    return {
      weekday,
      slug: def.slug,
      title: def.title,
      dateKey,
      count,
      target,
      completed: count >= target,
      isToday: dateKey === todayDateKey,
    };
  });

  // Son 30 gün aylık toplam ve devamlılık takvimi
  const baseDate = parseDateKey(todayDateKey);
  let monthlyTotalRepeats = 0;
  const continuityCalendar: StatisticsSnapshot['continuityCalendar'] = [];

  for (let offset = 29; offset >= 0; offset--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() - offset);
    const dk = formatDateKey(d);
    const total = getDayTotalRepeats(records, dk);
    monthlyTotalRepeats += total;
    let level: 0 | 1 | 2 | 3 = 0;
    if (total >= 1400) level = 3;
    else if (total >= 300) level = 2;
    else if (total > 0) level = 1;
    continuityCalendar.push({
      dateKey: dk,
      dayNumber: d.getDate(),
      total,
      level,
      isToday: dk === todayDateKey,
    });
  }

  // Devamlılık serisi (bugünden geriye kesintisiz zikir yapılan gün sayısı)
  let currentStreakDays = 0;
  for (let i = continuityCalendar.length - 1; i >= 0; i--) {
    if (continuityCalendar[i].total > 0) {
      currentStreakDays += 1;
    } else if (i === continuityCalendar.length - 1) {
      // Bugün henüz zikir yapılmadıysa dünden devam eden seriye bak
      continue;
    } else {
      break;
    }
  }

  // En çok yapılan zikirler (tüm kaydedilmiş günler boyunca)
  const totalsBySlug = new Map<string, number>();
  for (const dayMap of Object.values(records)) {
    for (const [slug, entry] of Object.entries(dayMap)) {
      if (entry && entry.count > 0) {
        totalsBySlug.set(slug, (totalsBySlug.get(slug) ?? 0) + entry.count);
      }
    }
  }

  const topDhikrs = Array.from(totalsBySlug.entries())
    .map(([slug, totalCount]) => {
      const def =
        getDhikrBySlug(slug) ?? customDhikrs.find((d) => d.slug === slug);
      return {
        slug,
        title: def?.title ?? slug,
        category: def?.category ?? 'custom',
        totalCount,
      };
    })
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 6);

  return {
    todayTotalRepeats,
    todayDailyVirdSummary,
    weeklyTotalRepeats,
    monthlyTotalRepeats,
    weeklySeries,
    weeklyTesbihStatus,
    continuityCalendar,
    currentStreakDays,
    topDhikrs,
  };
}

export function createBackupPayload(
  targets: CustomTargetsMap,
  records: RecordsByDate,
  settings: UserSettingsState,
  customDhikrs: DhikrDefinition[] = []
): AppBackupPayload {
  return {
    app: 'TANESI',
    version: 1,
    exportedAt: new Date().toISOString(),
    targets,
    records,
    settings,
    customDhikrs,
  };
}

export function validateBackupPayload(
  raw: unknown
): { ok: true; data: AppBackupPayload } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Geçersiz yedek dosyası formatı.' };
  }
  const obj = raw as Record<string, unknown>;
  if (obj.app !== 'TANESI' || obj.version !== 1) {
    return { ok: false, error: 'Bu dosya geçerli bir TANESİ yedek dosyası değil.' };
  }
  if (!obj.records || typeof obj.records !== 'object') {
    return { ok: false, error: 'Yedek dosyasında zikir kayıtları bulunamadı.' };
  }

  const cleanTargets: CustomTargetsMap = {};
  if (obj.targets && typeof obj.targets === 'object') {
    for (const [slug, val] of Object.entries(obj.targets as Record<string, unknown>)) {
      if (typeof val === 'number' && Number.isFinite(val) && val >= 1 && val <= 100000) {
        cleanTargets[slug] = Math.floor(val);
      }
    }
  }

  const cleanCustomDhikrs: DhikrDefinition[] = [];
  if (Array.isArray(obj.customDhikrs)) {
    for (const item of obj.customDhikrs) {
      if (!item || typeof item !== 'object') continue;
      const c = item as Record<string, unknown>;
      const slug = typeof c.slug === 'string' && c.slug.startsWith('custom-') ? c.slug : undefined;
      const built = validateAndBuildCustomDhikr(
        {
          title: typeof c.title === 'string' ? c.title : '',
          arabic: typeof c.arabic === 'string' ? c.arabic : '',
          transliteration: typeof c.transliteration === 'string' ? c.transliteration : '',
          meaning: typeof c.meaning === 'string' ? c.meaning : '',
          note: typeof c.note === 'string' ? c.note : '',
          defaultTarget: typeof c.defaultTarget === 'number' ? c.defaultTarget : 100,
        },
        slug
      );
      if (built.ok) {
        cleanCustomDhikrs.push(built.dhikr);
      }
    }
  }

  const cleanRecords: RecordsByDate = {};
  for (const [dateKey, dayMap] of Object.entries(obj.records as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || !dayMap || typeof dayMap !== 'object') {
      continue;
    }
    const cleanDay: Record<string, DailyEntry> = {};
    for (const [slug, entry] of Object.entries(dayMap as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue;
      const e = entry as Record<string, unknown>;
      const count = typeof e.count === 'number' && e.count >= 0 ? Math.floor(e.count) : 0;
      const target =
        typeof e.target === 'number' && e.target >= 1
          ? Math.floor(e.target)
          : getDhikrBySlug(slug)?.defaultTarget ??
            cleanCustomDhikrs.find((d) => d.slug === slug)?.defaultTarget ??
            100;
      cleanDay[slug] = {
        count,
        target,
        updatedAt: typeof e.updatedAt === 'string' ? e.updatedAt : new Date().toISOString(),
      };
    }
    cleanRecords[dateKey] = cleanDay;
  }

  const rawSettings = (obj.settings && typeof obj.settings === 'object'
    ? obj.settings
    : {}) as Record<string, unknown>;

  const cleanSettings: UserSettingsState = {
    soundEnabled:
      typeof rawSettings.soundEnabled === 'boolean'
        ? rawSettings.soundEnabled
        : DEFAULT_SETTINGS.soundEnabled,
    vibrationEnabled:
      typeof rawSettings.vibrationEnabled === 'boolean'
        ? rawSettings.vibrationEnabled
        : DEFAULT_SETTINGS.vibrationEnabled,
    fontSize:
      rawSettings.fontSize === 'small' || rawSettings.fontSize === 'large'
        ? rawSettings.fontSize
        : 'medium',
    theme: rawSettings.theme === 'dark' ? 'dark' : 'light',
    dayStartHour:
      typeof rawSettings.dayStartHour === 'number' &&
      rawSettings.dayStartHour >= 0 &&
      rawSettings.dayStartHour <= 23
        ? Math.floor(rawSettings.dayStartHour)
        : 0,
    reminders: Array.isArray(rawSettings.reminders)
      ? (rawSettings.reminders as ReminderItem[])
      : DEFAULT_REMINDERS,
  };

  return {
    ok: true,
    data: {
      app: 'TANESI',
      version: 1,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      targets: cleanTargets,
      records: cleanRecords,
      settings: cleanSettings,
      customDhikrs: cleanCustomDhikrs,
    },
  };
}

export function getAllCatalogSlugs(): string[] {
  return DHIKR_CATALOG.map((d) => d.slug);
}
