import { injectable, inject } from 'tsyringe';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database as DatabaseSchema } from './DatabaseSchema';
import type { IDatabase } from '@/domain/repositories/IDatabase';
import type { IConfigurationProvider } from '@/domain/providers/IConfigurationProvider';
import { TOKENS } from '../container/tokens';

@injectable()
export class Database implements IDatabase {
  private connection: Kysely<DatabaseSchema>;
  private pool: Pool;

  constructor(
    @inject(TOKENS.ConfigurationProvider)
    private readonly config: IConfigurationProvider
  ) {
    const dbConfig = this.config.getDatabaseConfig();

    this.pool = new Pool({
      connectionString: dbConfig.url,
      max: dbConfig.maxConnections,
      idleTimeoutMillis: dbConfig.idleTimeoutMs,
      connectionTimeoutMillis: dbConfig.connectionTimeoutMs,
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