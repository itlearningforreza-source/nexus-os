import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

interface MigrationResult {
  version: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

export class PostgresMigrator {
  private pool: Pool;
  private migrationsDir: string;
  
  constructor(pool: Pool, migrationsDir?: string) {
    this.pool = pool;
    this.migrationsDir = migrationsDir || path.join(projectRoot, 'migrations', 'postgres');
  }
  
  /**
   * Get all migration files sorted by version
   */
  private getMigrationFiles(): string[] {
    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`Migrations directory not found: ${this.migrationsDir}`);
      return [];
    }
    
    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort by filename (version prefix)
  }
  
  /**
   * Check if a migration has been applied
   */
  private async isApplied(version: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1',
      [version]
    );
    return result.rows.length > 0;
  }
  
  /**
   * Mark migration as applied
   */
  private async markApplied(version: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      [version]
    );
  }
  
  /**
   * Run all pending migrations
   */
  async migrate(): Promise<MigrationResult[]> {
    const files = this.getMigrationFiles();
    const results: MigrationResult[] = [];
    
    // Ensure schema_migrations table exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    for (const file of files) {
      const version = file.replace('.sql', '');
      const startTime = Date.now();
      
      try {
        // Check if already applied
        if (await this.isApplied(version)) {
          console.log(`Migration ${version} already applied, skipping`);
          results.push({ version, success: true, durationMs: 0 });
          continue;
        }
        
        // Read and execute migration
        const sql = fs.readFileSync(path.join(this.migrationsDir, file), 'utf8');
        
        // Split by semicolon but be careful with function bodies
        // For simplicity, we'll execute the whole file as a single transaction
        const startTx = Date.now();
        await this.pool.query('BEGIN');
        try {
          await this.pool.query(sql);
          await this.pool.query('COMMIT');
          await this.markApplied(version);
          const duration = Date.now() - startTime;
          console.log(`✓ Applied migration: ${version} (${duration}ms)`);
          results.push({ version, success: true, durationMs: duration });
        } catch (txError) {
          await this.pool.query('ROLLBACK');
          throw txError;
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed migration: ${version} - ${errorMessage}`);
        results.push({ version, success: false, error: errorMessage, durationMs: duration });
      }
    }
    
    return results;
  }
  
  /**
   * Get migration status
   */
  async getStatus(): Promise<{ version: string; applied: boolean; appliedAt?: Date }[]> {
    const files = this.getMigrationFiles();
    const status = [];
    
    for (const file of files) {
      const version = file.replace('.sql', '');
      const applied = await this.isApplied(version);
      
      let appliedAt: Date | undefined;
      if (applied) {
        const result = await this.pool.query(
          'SELECT applied_at FROM schema_migrations WHERE version = $1',
          [version]
        );
        appliedAt = new Date(result.rows[0].applied_at);
      }
      
      status.push({ version, applied, appliedAt });
    }
    
    return status;
  }
  
  /**
   * Rollback last migration (not implemented for safety)
   */
  async rollback(version: string): Promise<void> {
    throw new Error('Rollback not supported. Create a new migration to revert changes.');
  }
}

interface MigrationResult {
  version: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

/**
 * Run migrations (convenience function)
 */
export async function runMigrations(pool: Pool, migrationsDir?: string): Promise<MigrationResult[]> {
  const migrator = new PostgresMigrator(pool, migrationsDir);
  return migrator.migrate();
}

/**
 * Check migration status
 */
export async function getMigrationStatus(pool: Pool, migrationsDir?: string) {
  const migrator = new PostgresMigrator(pool, migrationsDir);
  return migrator.getStatus();
}

/**
 * Create a new migration file template
 */
export function createMigrationFile(name: string, migrationsDir?: string): string {
  const dir = migrationsDir || path.join(projectRoot, 'migrations', 'postgres');
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Generate version from timestamp
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').slice(0, 14);
  const version = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
  const fileName = `${version}.sql`;
  const filePath = path.join(dir, fileName);
  
  const template = `-- Migration: ${name}
-- Version: ${version}
-- Created: ${new Date().toISOString()}

-- Add your SQL here

-- Example:
-- ALTER TABLE users ADD COLUMN new_column TEXT;
-- CREATE INDEX idx_users_new_column ON users(new_column);

-- Remember to update the updated_at trigger if adding new columns with updated_at
`;
  
  fs.writeFileSync(filePath, template);
  console.log(`Created migration: ${filePath}`);
  return filePath;
}

// CLI helper
async function runCli() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });
  
  try {
    switch (command) {
      case 'migrate':
        await runMigrations(new Pool({ connectionString: process.env.DATABASE_URL }));
        break;
      case 'status':
        const status = await getMigrationStatus(new Pool({ connectionString: process.env.DATABASE_URL }));
        console.table(status);
        break;
      case 'create':
        if (!args[1]) {
          console.error('Usage: npm run migration:create <name>');
          process.exit(1);
        }
        createMigrationFile(args[1]);
        break;
      default:
        console.log('Usage:');
        console.log('  npm run migration:migrate   - Run pending migrations');
        console.log('  npm run migration:status    - Show migration status');
        console.log('  npm run migration:create <name> - Create new migration');
    }
  } finally {
    await pool.end();
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli().catch(console.error);
}

export { config } from 'dotenv';
