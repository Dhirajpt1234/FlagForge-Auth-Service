import { PrismaClient } from '@prisma/client';
import type { IDatabaseClient } from './IDatabase.client';

export class PrismaDatabaseClient implements IDatabaseClient {
  private static instance: PrismaDatabaseClient;
  private prisma: PrismaClient;

  private constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
  }

  public static getInstance(): PrismaDatabaseClient {
    if (!PrismaDatabaseClient.instance) {
      PrismaDatabaseClient.instance = new PrismaDatabaseClient();
    }
    return PrismaDatabaseClient.instance;
  }

  public getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  public async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  public async testConnection(): Promise<string> {
    try {
      await this.connect();
      const result = await this.prisma.$queryRaw`SELECT version()`;
      const version = Array.isArray(result) && result.length > 0 ? (result[0] as any).version : 'Unknown';
      return `Database connected successfully. PostgreSQL version: ${version}`;
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    } finally {
      await this.disconnect();
    }
  }
}
