import type { IDatabaseClient } from './IDatabase.client';
import { PrismaDatabaseClient } from './PrismaDatabase.client';

export class DatabaseClient {
  private static instance: IDatabaseClient;

  public static getInstance(): IDatabaseClient {
    if (!DatabaseClient.instance) {
      // Factory method - can easily switch implementations here
      DatabaseClient.instance = PrismaDatabaseClient.getInstance();
    }
    return DatabaseClient.instance;
  }

  // For backward compatibility and type safety
  public static getPrismaInstance(): PrismaDatabaseClient {
    const instance = DatabaseClient.getInstance();
    if (instance instanceof PrismaDatabaseClient) {
      return instance;
    }
    throw new Error('Current database implementation is not Prisma');
  }
}

export default DatabaseClient;
