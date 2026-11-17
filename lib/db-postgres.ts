import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const { Pool } = pg;

// Determine database type
const USE_POSTGRES = process.env.USE_POSTGRES === 'true';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// PostgreSQL Pool (for production)
let pgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }
    
    pgPool = new pg.Pool({
      connectionString,
      max: parseInt(process.env.PG_POOL_MAX || '20'),
      idleTimeoutMillis: parseInt(process.env.PG_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.PG_CONNECTION_TIMEOUT || '2000'),
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    
    // Error handling
    pgPool.on('error', (err: Error) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }
  
  return pgPool;
}

// Close PostgreSQL pool (for graceful shutdown)
export async function closePgPool(): Promise<void> {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
}

// Factory function to get the appropriate database
export function getDb() {
  if (process.env.USE_POSTGRES === 'true') {
    return getPgDb();
  }
  // Fallback to SQLite (existing implementation)
  return getSqliteDb();
}

// PostgreSQL Database Wrapper (mimics better-sqlite3 API)
export function getPgDb() {
  const pool = getPgPool();
  
  return {
    // Execute a query that returns multiple rows
    prepare: (sql: string) => {
      return {
        all: async (...params: any[]) => {
          const result = await pool.query(sql, params);
          return result.rows;
        },
        get: async (...params: any[]) => {
          const result = await pool.query(sql, params);
          return result.rows[0] || null;
        },
        run: async (...params: any[]) => {
          const result = await pool.query(sql, params);
          return { 
            changes: result.rowCount || 0, 
            lastInsertRowid: result.rows[0]?.id || null 
          };
        },
      };
    },
    
    // Transaction support
    transaction: (fn: () => Promise<void>) => {
      return async () => {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const result = await fn();
          await client.query('COMMIT');
          return result;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      };
    },
    
    // Pragmas (no-op for PostgreSQL)
    pragma: (setting: string) => {
      // PostgreSQL doesn't use pragmas, but we can handle some
      if (setting.includes('foreign_keys')) {
        // Foreign keys are always enforced in PostgreSQL
        return;
      }
    },
    
    // Close connection
    close: async () => {
      await closePgPool();
    },
  };
}

// SQLite Database (existing implementation)
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrate } from './schema';

let sqliteDb: Database.Database | null = null;

function getSqliteDb(): Database.Database {
  if (sqliteDb) return sqliteDb;
  
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'nexus.db');
  
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');
  migrate(sqliteDb);
  
  return sqliteDb;
}

// Export the active database
const db = getDb();
export { db };

// Health check for database connection
export async function checkDbHealth(): Promise<{ healthy: boolean; type: string; error?: string }> {
  try {
    if (USE_POSTGRES) {
      const pool = getPgPool();
      const result = await pool.query('SELECT 1 as health');
      const row = result.rows[0] as { health?: number } | undefined;
      return { healthy: row?.health === 1, type: 'postgresql' };
    } else {
      const db = getSqliteDb();
      const result = db.prepare('SELECT 1 as health').get() as { health?: number } | undefined;
      return { healthy: result?.health === 1, type: 'sqlite' };
    }
  } catch (error) {
    return { 
      healthy: false, 
      type: USE_POSTGRES ? 'postgresql' : 'sqlite', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Initialize database (run on startup)
export async function initializeDb(): Promise<void> {
  if (USE_POSTGRES) {
    const pool = getPgPool();
    // Test connection
    await pool.query('SELECT 1');
    console.log('PostgreSQL connection established');
  } else {
    // SQLite is initialized on first getDb() call
    getSqliteDb();
    console.log('SQLite database initialized');
  }
}

export default db;
