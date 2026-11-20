import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_DHIKRS, WEEKLY_DHIKRS, ADDITIONAL_DHIKRS, SPECIAL_DHIKRS } from '../data/dhikrs';
import {
  calculateProgressPercent,
  computeStatistics,
  createBackupPayload,
  DEFAULT_SETTINGS,
  getDailyVirdsSummary,
  getEffectiveDateInfo,
  incrementDhikrRecord,
  resetDhikrRecord,
  validateAndBuildCustomDhikr,
  validateBackupPayload,
} from './dhikrLogic';

test('catalog contains all required sections and daily target totals 1400', () => {
  assert.equal(DAILY_DHIKRS.length, 5);
  assert.equal(WEEKLY_DHIKRS.length, 7);
  assert.equal(ADDITIONAL_DHIKRS.length, 7);
  assert.equal(SPECIAL_DHIKRS.length, 1);

  const totalDailyTarget = DAILY_DHIKRS.reduce((sum, item) => sum + item.defaultTarget, 0);
  assert.equal(totalDailyTarget, 1400);
});

test('effective date respects custom dayStartHour rollover', () => {
  // 2026-11-20 saat 02:30 -> gün başlangıcı 04:00 ise bir önceki gün (19 Kasım) sayılır
  const earlyMorning = new Date(2026, 10, 20, 2, 30, 0);
  const withFajrStart = getEffectiveDateInfo(earlyMorning, 4);
  assert.equal(withFajrStart.dateKey, '2026-11-19');
  assert.equal(withFajrStart.weekday, 4); // Perşembe

  // Aynı saatte gün başlangıcı 00:00 ise 20 Kasım Cuma sayılır
  const withMidnightStart = getEffectiveDateInfo(earlyMorning, 0);
  assert.equal(withMidnightStart.dateKey, '2026-11-20');
  assert.equal(withMidnightStart.weekday, 5); // Cuma
});

test('increment, undo, completion trigger, and reset work accurately', () => {
  let records = {};
  const r1 = incrementDhikrRecord(records, '2026-11-20', 'daily-istigfar', 3, 1);
  assert.equal(r1.nextCount, 1);
  assert.equal(r1.justCompleted, false);

  const r2 = incrementDhikrRecord(r1.nextRecords, '2026-11-20', 'daily-istigfar', 3, 2);
  assert.equal(r2.nextCount, 3);
  assert.equal(r2.justCompleted, true);

  // Undo never goes below 0
  const r3 = incrementDhikrRecord(r2.nextRecords, '2026-11-20', 'daily-istigfar', 3, -1);
  assert.equal(r3.nextCount, 2);
  assert.equal(r3.justCompleted, false);

  const afterReset = resetDhikrRecord(r3.nextRecords, '2026-11-20', 'daily-istigfar', 3);
  assert.equal(afterReset['2026-11-20']['daily-istigfar'].count, 0);
});

test('daily virds summary caps over-target repeats for percentage while preserving raw total', () => {
  const records = {
    '2026-11-20': {
      'daily-istigfar': { count: 120, target: 100, updatedAt: '2026-11-20T10:00:00Z' },
      'daily-tevhid': { count: 100, target: 100, updatedAt: '2026-11-20T10:00:00Z' },
    },
  };
  const summary = getDailyVirdsSummary(records, '2026-11-20', {});
  assert.equal(summary.completedRepeats, 220);
  assert.equal(summary.cappedRepeats, 200);
  assert.equal(summary.totalTarget, 1400);
  assert.equal(summary.completedVirdCount, 2);
  assert.equal(summary.percentage, calculateProgressPercent(200, 1400));
});

test('statistics preserve past days and compute weekly, monthly, streak, and top dhikrs', () => {
  const records = {
    '2026-11-19': {
      'daily-istigfar': { count: 100, target: 100, updatedAt: '2026-11-19T12:00:00Z' },
      'weekly-persembe': { count: 100, target: 100, updatedAt: '2026-11-19T14:00:00Z' },
    },
    '2026-11-20': {
      'daily-istigfar': { count: 50, target: 100, updatedAt: '2026-11-20T09:00:00Z' },
      'weekly-cuma': { count: 100, target: 100, updatedAt: '2026-11-20T11:00:00Z' },
    },
  };
  const stats = computeStatistics(records, '2026-11-20', {});
  assert.equal(stats.todayTotalRepeats, 150);
  assert.equal(stats.weeklyTotalRepeats, 350);
  assert.equal(stats.monthlyTotalRepeats, 350);
  assert.equal(stats.currentStreakDays, 2);
  assert.equal(stats.topDhikrs[0].slug, 'daily-istigfar');
  assert.equal(stats.topDhikrs[0].totalCount, 150);

  const thursdayStatus = stats.weeklyTesbihStatus.find((d) => d.weekday === 4);
  const fridayStatus = stats.weeklyTesbihStatus.find((d) => d.weekday === 5);
  assert.equal(thursdayStatus?.completed, true);
  assert.equal(fridayStatus?.completed, true);
});

test('custom dhikr validation, statistics resolution, and backup round-trip work cleanly', () => {
  assert.equal(
    validateAndBuildCustomDhikr({ title: '', transliteration: 'Yâ Latîf', defaultTarget: 129 }).ok,
    false
  );
  assert.equal(
    validateAndBuildCustomDhikr({ title: 'Yâ Latîf', arabic: '', transliteration: '', defaultTarget: 129 }).ok,
    false
  );
  assert.equal(
    validateAndBuildCustomDhikr({ title: 'Yâ Latîf', transliteration: 'Yâ Latîf', defaultTarget: 0 }).ok,
    false
  );

  const built = validateAndBuildCustomDhikr({
    title: 'Yâ Latîf',
    arabic: 'يَا لَطِيفُ',
    transliteration: 'Yâ Latîf',
    meaning: 'Lütfu ve ihsanı bol olan Allah.',
    defaultTarget: 129,
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;

  assert.equal(built.dhikr.category, 'custom');
  assert.equal(built.dhikr.defaultTarget, 129);
  assert.ok(built.dhikr.slug.startsWith('custom-'));

  const records = {
    '2026-11-20': {
      [built.dhikr.slug]: { count: 40, target: 129, updatedAt: '2026-11-20T10:00:00Z' },
    },
  };
  const stats = computeStatistics(records, '2026-11-20', {}, [built.dhikr]);
  assert.equal(stats.topDhikrs[0].title, 'Yâ Latîf');
  assert.equal(stats.topDhikrs[0].totalCount, 40);

  const backup = createBackupPayload({}, records, DEFAULT_SETTINGS, [built.dhikr]);
  const validated = validateBackupPayload(backup);
  assert.equal(validated.ok, true);
  if (validated.ok) {
    assert.equal(validated.data.customDhikrs?.length, 1);
    assert.equal(validated.data.customDhikrs?.[0].title, 'Yâ Latîf');
  }
});

test('backup payload round-trip validation rejects malformed input and accepts valid backup', () => {
  assert.equal(validateBackupPayload({ foo: 'bar' }).ok, false);

  const backup = createBackupPayload(
    { 'additional-5-rabbena-zalemna': 100 },
    {
      '2026-11-20': {
        'daily-istigfar': { count: 33, target: 100, updatedAt: '2026-11-20T08:00:00Z' },
      },
    },
    { ...DEFAULT_SETTINGS, theme: 'dark', dayStartHour: 4 }
  );

  const result = validateBackupPayload(backup);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.targets['additional-5-rabbena-zalemna'], 100);
    assert.equal(result.data.records['2026-11-20']['daily-istigfar'].count, 33);
    assert.equal(result.data.settings.theme, 'dark');
    assert.equal(result.data.settings.dayStartHour, 4);
  }
});
