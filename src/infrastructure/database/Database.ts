import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database as DatabaseSchema } from './DatabaseSchema';

export class Database {
  private static instance: Kysely<DatabaseSchema> | null = null;

  public static getInstance(): Kysely<DatabaseSchema> {
    if (!Database.instance) {
      Database.instance = Database.createConnection();
    }
    return Database.instance;
  }

  private static createConnection(): Kysely<DatabaseSchema> {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    return new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool,
      }),
    });
  }

  public static async close(): Promise<void> {
    if (Database.instance) {
      await Database.instance.destroy();
      Database.instance = null;
    }
  }
}

export type { Kysely as DatabaseInstance } from 'kysely';
export type { DatabaseSchema };