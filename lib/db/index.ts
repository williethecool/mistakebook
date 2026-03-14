/**
 * Database connection — uses Neon serverless Postgres.
 * Works on Vercel Edge/Serverless and local dev.
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.POSTGRES_URL!);
export const db = drizzle(sql, { schema });
export * from './schema';
