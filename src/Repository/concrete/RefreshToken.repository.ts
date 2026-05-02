import type { default as IRefreshTokenRepository } from '../IRefreshToken.repository';
import DatabaseClient from '../../Database/db.client';
import { DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaClient } from '@prisma/client';

export default class RefreshTokenRepository implements IRefreshTokenRepository {
  private dbClient: PrismaClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    try {
      await this.dbClient.refreshToken.create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Error creating refresh token:', error);
      throw new DatabaseError('Failed to create refresh token');
    }
  }

  async findByTokenHash(tokenHash: string): Promise<{ id: string; userId: string; tokenHash: string; expiresAt: Date } | null> {
    try {
      const token = await this.dbClient.refreshToken.findFirst({
        where: { tokenHash },
      });

      if (!token) {
        return null;
      }

      return {
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      };
    } catch (error) {
      console.error('Error finding refresh token:', error);
      throw new DatabaseError('Failed to find refresh token');
    }
  }

  async findValidTokens(): Promise<{ id: string; userId: string; tokenHash: string; expiresAt: Date }[]> {
    try {
      const tokens = await this.dbClient.refreshToken.findMany({
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return tokens.map((token: any) => ({
        id: token.id,
        userId: token.userId,
        tokenHash: token.tokenHash,
        expiresAt: token.expiresAt,
      }));
    } catch (error) {
      console.error('Error finding valid refresh tokens:', error);
      throw new DatabaseError('Failed to find valid refresh tokens');
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.dbClient.refreshToken.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting refresh token:', error);
      throw new DatabaseError('Failed to delete refresh token');
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.dbClient.refreshToken.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Error deleting refresh tokens by user:', error);
      throw new DatabaseError('Failed to delete refresh tokens');
    }
  }
}
