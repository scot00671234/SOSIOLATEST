import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Handle both Railway and local PostgreSQL connections
const connectionString = process.env.DATABASE_URL;

// Configure pool for Railway and local compatibility
export const pool = new Pool({ 
  connectionString,
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1') 
    ? false 
    : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });