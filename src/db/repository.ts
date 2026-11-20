import { and, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  customDhikrs,
  dailyRecords,
  dhikrDefinitions,
  users,
  userSettings,
  userTargets,
} from './schema.ts';
import { DHIKR_CATALOG } from '../data/dhikrs.ts';

let catalogSeeded = false;

export async function ensureDhikrCatalogSeeded() {
  if (catalogSeeded) return;
  try {
    for (const item of DHIKR_CATALOG) {
      await db
        .insert(dhikrDefinitions)
        .values({
          slug: item.slug,
          category: item.category,
          weekday: item.weekday ?? null,
          title: item.title,
          arabic: item.arabic,
          transliteration: item.transliteration,
          meaning: item.meaning,
          note: item.note ?? '',
          defaultTarget: item.defaultTarget,
          sortOrder: item.sortOrder,
        })
        .onConflictDoNothing({ target: dhikrDefinitions.slug });
    }
    catalogSeeded = true;
  } catch (error) {
    console.error('Failed to seed dhikr catalog:', error);
    throw new Error('Zikir tanımları hazırlanırken bir hata oluştu.', { cause: error });
  }
}

export async function getOrCreateUser(uid: string, email: string, displayName = '') {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to upsert user:', error);
    throw new Error('Kullanıcı hesabı senkronize edilemedi.', { cause: error });
  }
}

export async function getUserSnapshot(userId: number) {
  try {
    await ensureDhikrCatalogSeeded();
    const [records, targets, settingsRows, customRows] = await Promise.all([
      db.select().from(dailyRecords).where(eq(dailyRecords.userId, userId)),
      db.select().from(userTargets).where(eq(userTargets.userId, userId)),
      db.select().from(userSettings).where(eq(userSettings.userId, userId)),
      db.select().from(customDhikrs).where(eq(customDhikrs.userId, userId)),
    ]);

    return {
      records,
      targets,
      settings: settingsRows[0] ?? null,
      customDhikrs: customRows,
    };
  } catch (error) {
    console.error('Failed to load user snapshot:', error);
    throw new Error('Kullanıcı verileri alınamadı.', { cause: error });
  }
}

export interface CustomDhikrRecordInput {
  slug: string;
  title: string;
  arabic?: string;
  transliteration?: string;
  meaning?: string;
  note?: string;
  defaultTarget: number;
}

export async function upsertCustomDhikr(
  userId: number,
  input: CustomDhikrRecordInput
) {
  try {
    const safeTarget = Math.max(1, Math.min(100000, Math.floor(input.defaultTarget)));
    const result = await db
      .insert(customDhikrs)
      .values({
        userId,
        slug: input.slug,
        title: input.title.trim(),
        arabic: (input.arabic ?? '').trim(),
        transliteration: (input.transliteration ?? '').trim(),
        meaning: (input.meaning ?? '').trim(),
        note: (input.note ?? '').trim(),
        defaultTarget: safeTarget,
      })
      .onConflictDoUpdate({
        target: [customDhikrs.userId, customDhikrs.slug],
        set: {
          title: input.title.trim(),
          arabic: (input.arabic ?? '').trim(),
          transliteration: (input.transliteration ?? '').trim(),
          meaning: (input.meaning ?? '').trim(),
          note: (input.note ?? '').trim(),
          defaultTarget: safeTarget,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to upsert custom dhikr:', error);
    throw new Error('Özel tesbih kaydedilemedi.', { cause: error });
  }
}

export async function deleteCustomDhikr(userId: number, slug: string) {
  try {
    await db
      .delete(customDhikrs)
      .where(and(eq(customDhikrs.userId, userId), eq(customDhikrs.slug, slug)));
  } catch (error) {
    console.error('Failed to delete custom dhikr:', error);
    throw new Error('Özel tesbih silinemedi.', { cause: error });
  }
}

export async function upsertDailyRecord(
  userId: number,
  dhikrSlug: string,
  recordDate: string,
  count: number,
  targetSnapshot: number
) {
  try {
    const safeCount = Math.max(0, Math.floor(count));
    const safeTarget = Math.max(1, Math.floor(targetSnapshot));
    const completedAt = safeCount >= safeTarget ? new Date() : null;

    const result = await db
      .insert(dailyRecords)
      .values({
        userId,
        dhikrSlug,
        recordDate,
        count: safeCount,
        targetSnapshot: safeTarget,
        completedAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailyRecords.userId, dailyRecords.dhikrSlug, dailyRecords.recordDate],
        set: {
          count: safeCount,
          targetSnapshot: safeTarget,
          completedAt,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert daily record:', error);
    throw new Error('Günlük zikir kaydı güncellenemedi.', { cause: error });
  }
}

export async function upsertUserTarget(
  userId: number,
  dhikrSlug: string,
  targetCount: number
) {
  try {
    const safeTarget = Math.max(1, Math.min(100000, Math.floor(targetCount)));
    const result = await db
      .insert(userTargets)
      .values({
        userId,
        dhikrSlug,
        targetCount: safeTarget,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userTargets.userId, userTargets.dhikrSlug],
        set: {
          targetCount: safeTarget,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user target:', error);
    throw new Error('Zikir hedefi kaydedilemedi.', { cause: error });
  }
}

export interface SettingsUpdateInput {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark';
  dayStartHour: number;
  remindersJson: string;
}

export async function upsertUserSettings(userId: number, input: SettingsUpdateInput) {
  try {
    const safeHour = Math.max(0, Math.min(23, Math.floor(input.dayStartHour)));
    const result = await db
      .insert(userSettings)
      .values({
        userId,
        soundEnabled: Boolean(input.soundEnabled),
        vibrationEnabled: Boolean(input.vibrationEnabled),
        fontSize: input.fontSize,
        theme: input.theme,
        dayStartHour: safeHour,
        remindersJson: input.remindersJson,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          soundEnabled: Boolean(input.soundEnabled),
          vibrationEnabled: Boolean(input.vibrationEnabled),
          fontSize: input.fontSize,
          theme: input.theme,
          dayStartHour: safeHour,
          remindersJson: input.remindersJson,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user settings:', error);
    throw new Error('Kullanıcı ayarları kaydedilemedi.', { cause: error });
  }
}

export async function bulkImportUserData(
  userId: number,
  payload: {
    targets: Record<string, number>;
    records: Record<string, Record<string, { count: number; target: number }>>;
    settings: SettingsUpdateInput;
    customDhikrs?: CustomDhikrRecordInput[];
  }
) {
  try {
    await upsertUserSettings(userId, payload.settings);
    if (Array.isArray(payload.customDhikrs)) {
      for (const item of payload.customDhikrs) {
        if (item && typeof item.slug === 'string' && typeof item.title === 'string' && item.title.trim()) {
          await upsertCustomDhikr(userId, item);
        }
      }
    }
    for (const [slug, target] of Object.entries(payload.targets)) {
      if (typeof target === 'number' && target >= 1) {
        await upsertUserTarget(userId, slug, target);
      }
    }
    for (const [dateStr, dayMap] of Object.entries(payload.records)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      for (const [slug, rec] of Object.entries(dayMap)) {
        if (rec && typeof rec.count === 'number') {
          await upsertDailyRecord(userId, slug, dateStr, rec.count, rec.target || 100);
        }
      }
    }
    return await getUserSnapshot(userId);
  } catch (error) {
    console.error('Failed to import user data:', error);
    throw new Error('Yedek verileri içe aktarılamadı.', { cause: error });
  }
}

export async function deleteDailyRecord(
  userId: number,
  dhikrSlug: string,
  recordDate: string
) {
  try {
    await db
      .delete(dailyRecords)
      .where(
        and(
          eq(dailyRecords.userId, userId),
          eq(dailyRecords.dhikrSlug, dhikrSlug),
          eq(dailyRecords.recordDate, recordDate)
        )
      );
  } catch (error) {
    console.error('Failed to delete daily record:', error);
    throw new Error('Kayıt silinemedi.', { cause: error });
  }
}
