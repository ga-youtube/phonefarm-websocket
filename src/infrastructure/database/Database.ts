import { injectable } from 'tsyringe';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database as DatabaseSchema } from './DatabaseSchema';
import type { IDatabase } from '@/domain/repositories/IDatabase';

@injectable()
export class Database implements IDatabase {
  private connection: Kysely<DatabaseSchema>;
  private pool: Pool;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.connection = new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool: this.pool,
      }),
    });
  }

  public getConnection(): Kysely<DatabaseSchema> {
    return this.connection;
  }

  public async close(): Promise<void> {
    await this.connection.destroy();
  }
}

export type { Kysely as DatabaseInstance } from 'kysely';
export type { DatabaseSchema };