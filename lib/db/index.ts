/**
 * Database connection — uses Vercel Postgres (Neon) in production,
 * falls back to standard postgres for local dev.
 */
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import * as schema from './schema';

export const db = drizzle(sql, { schema });
export * from './schema';
