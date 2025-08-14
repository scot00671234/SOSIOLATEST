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

// Configure SSL based on environment and connection string
// Default to no SSL unless explicitly required
let sslConfig: false | { rejectUnauthorized: boolean } = false;

// Check various conditions that indicate SSL should be enabled
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const hasSSLInUrl = connectionString.includes('sslmode=require') || connectionString.includes('ssl=true');
const isProductionWithSSL = process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true';

// Enable SSL only if explicitly required
if (!isLocalhost && (hasSSLInUrl || isProductionWithSSL)) {
  sslConfig = { rejectUnauthorized: false };
}

// Configure pool for VPS, Railway, and local compatibility
export const pool = new Pool({ 
  connectionString,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const db = drizzle(pool, { schema });