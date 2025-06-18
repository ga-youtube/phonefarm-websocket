import type { Kysely } from 'kysely';
import type { Database as DatabaseSchema } from '@/infrastructure/database/DatabaseSchema';

export interface IDatabase {
  getConnection(): Kysely<DatabaseSchema>;
  close(): Promise<void>;
}