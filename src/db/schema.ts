import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// 1. Kullanıcılar tablosu (Firebase Auth UID ile bağlı)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Zikir tanımları tablosu
export const dhikrDefinitions = pgTable('dhikr_definitions', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(), // 'daily' | 'weekly' | 'additional' | 'special'
  weekday: integer('weekday'), // 0=Pazar, 1=Pazartesi ... 6=Cumartesi (yalnızca weekly için)
  title: text('title').notNull(),
  arabic: text('arabic').notNull(),
  transliteration: text('transliteration').notNull(),
  meaning: text('meaning').notNull().default(''),
  note: text('note').default(''),
  defaultTarget: integer('default_target').notNull().default(100),
  sortOrder: integer('sort_order').notNull().default(0),
});

// 3. Kullanıcı hedefleri tablosu (her zikir için özelleştirilebilir hedef)
export const userTargets = pgTable(
  'user_targets',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    dhikrSlug: text('dhikr_slug').notNull(),
    targetCount: integer('target_count').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_targets_user_slug_idx').on(table.userId, table.dhikrSlug),
  ]
);

// 4. Günlük zikir kayıtları tablosu (her gün ve zikir için ayrı geçmiş kaydı)
export const dailyRecords = pgTable(
  'daily_records',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    dhikrSlug: text('dhikr_slug').notNull(),
    recordDate: text('record_date').notNull(), // YYYY-MM-DD (gün başlangıç saatine göre)
    count: integer('count').notNull().default(0),
    targetSnapshot: integer('target_snapshot').notNull().default(100),
    completedAt: timestamp('completed_at'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('daily_records_user_slug_date_idx').on(
      table.userId,
      table.dhikrSlug,
      table.recordDate
    ),
  ]
);

// 5. Kullanıcı ayarları tablosu
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  soundEnabled: boolean('sound_enabled').notNull().default(true),
  vibrationEnabled: boolean('vibration_enabled').notNull().default(true),
  fontSize: text('font_size').notNull().default('medium'), // 'small' | 'medium' | 'large'
  theme: text('theme').notNull().default('light'), // 'light' | 'dark'
  dayStartHour: integer('day_start_hour').notNull().default(0), // 0..23
  remindersJson: text('reminders_json').notNull().default('[]'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Kullanıcının kendi eklediği özel tesbihler tablosu
export const customDhikrs = pgTable(
  'custom_dhikrs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    arabic: text('arabic').notNull().default(''),
    transliteration: text('transliteration').notNull().default(''),
    meaning: text('meaning').notNull().default(''),
    note: text('note').notNull().default(''),
    defaultTarget: integer('default_target').notNull().default(100),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('custom_dhikrs_user_slug_idx').on(table.userId, table.slug),
  ]
);

// İlişkiler
export const usersRelations = relations(users, ({ many, one }) => ({
  targets: many(userTargets),
  dailyRecords: many(dailyRecords),
  customDhikrs: many(customDhikrs),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const customDhikrsRelations = relations(customDhikrs, ({ one }) => ({
  user: one(users, {
    fields: [customDhikrs.userId],
    references: [users.id],
  }),
}));

export const userTargetsRelations = relations(userTargets, ({ one }) => ({
  user: one(users, {
    fields: [userTargets.userId],
    references: [users.id],
  }),
}));

export const dailyRecordsRelations = relations(dailyRecords, ({ one }) => ({
  user: one(users, {
    fields: [dailyRecords.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
