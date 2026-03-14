/**
 * Database schema using Drizzle ORM
 * Works with Vercel Postgres (Neon) or any Postgres instance
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  varchar,
  index,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const scanStatusEnum = pgEnum('scan_status', [
  'pending',
  'processing',
  'done',
  'error',
]);

export const questionStatusEnum = pgEnum('question_status', [
  'wrong',
  'correct',
  'unknown',
]);

export const storageProviderEnum = pgEnum('storage_provider', [
  'vercel',
  'supabase',
  's3',
  'r2',
]);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  passwordHash: text('password_hash'),
  emailVerified: timestamp('email_verified'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Auth Accounts (OAuth) ────────────────────────────────────────────────────
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: timestamp('expires_at'),
  tokenType: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// ─── Verification Tokens ──────────────────────────────────────────────────────
export const verificationTokens = pgTable('verification_tokens', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// ─── User Settings ────────────────────────────────────────────────────────────
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  // AI
  aiApiKey: text('ai_api_key'),
  aiBaseUrl: text('ai_base_url'),
  aiModel: varchar('ai_model', { length: 100 }).default('gpt-4o').notNull(),
  // Storage
  storageProvider: storageProviderEnum('storage_provider')
    .default('vercel')
    .notNull(),
  // Supabase storage
  supabaseUrl: text('supabase_url'),
  supabaseKey: text('supabase_key'),
  supabaseBucket: varchar('supabase_bucket', { length: 255 }),
  // AWS S3
  s3Region: varchar('s3_region', { length: 64 }),
  s3Bucket: varchar('s3_bucket', { length: 255 }),
  s3AccessKey: text('s3_access_key'),
  s3SecretKey: text('s3_secret_key'),
  // Cloudflare R2
  r2AccountId: varchar('r2_account_id', { length: 255 }),
  r2Bucket: varchar('r2_bucket', { length: 255 }),
  r2AccessKey: text('r2_access_key'),
  r2SecretKey: text('r2_secret_key'),
  // Features
  autoCropEnabled: boolean('auto_crop_enabled').default(true).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Scans ────────────────────────────────────────────────────────────────────
export const scans = pgTable(
  'scans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    subject: varchar('subject', { length: 255 }),
    status: scanStatusEnum('status').default('pending').notNull(),
    errorMessage: text('error_message'),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (t) => ({
    userIdx: index('scans_user_id_idx').on(t.userId),
    statusIdx: index('scans_status_idx').on(t.status),
  })
);

// ─── Questions ────────────────────────────────────────────────────────────────
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subject: varchar('subject', { length: 255 }).notNull(),
    topic: varchar('topic', { length: 255 }),
    questionText: text('question_text'),
    cropImageUrl: text('crop_image_url'),
    status: questionStatusEnum('status').default('unknown').notNull(),
    bbox: jsonb('bbox'), // { x, y, width, height } normalised 0–1
    explanation: text('explanation'),
    explainedAt: timestamp('explained_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('questions_user_id_idx').on(t.userId),
    scanIdx: index('questions_scan_id_idx').on(t.scanId),
    subjectIdx: index('questions_subject_idx').on(t.subject),
    statusIdx: index('questions_status_idx').on(t.status),
  })
);

// ─── Tags ─────────────────────────────────────────────────────────────────────
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 20 }).default('#ff3d1f').notNull(),
});

export const questionTags = pgTable('question_tags', {
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});
