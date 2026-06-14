import type { default as IPasswordResetTokenRepository } from '../IPasswordResetToken.repository';
import DatabaseClient from '../../Database/db.client';
import { DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaClient } from '@prisma/client';

export default class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  private dbClient: PrismaClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await this.dbClient.passwordResetToken.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });
    } catch (error) {
      console.error('Error creating password reset token:', error);
      throw new DatabaseError('Failed to create password reset token');
    }
  }

  async findByToken(token: string): Promise<{ id: string; userId: string; token: string; expiresAt: Date; used: boolean } | null> {
    try {
      const resetToken = await this.dbClient.passwordResetToken.findFirst({
        where: { token },
      });

      if (!resetToken) {
        return null;
      }

      return {
        id: resetToken.id,
        userId: resetToken.userId,
        token: resetToken.token,
        expiresAt: resetToken.expiresAt,
        used: resetToken.used,
      };
    } catch (error) {
      console.error('Error finding password reset token:', error);
      throw new DatabaseError('Failed to find password reset token');
    }
  }

  async findByUserId(userId: string): Promise<{ id: string; userId: string; token: string; expiresAt: Date; used: boolean }[]> {
    try {
      const tokens = await this.dbClient.passwordResetToken.findMany({
        where: { userId },
      });

      return tokens.map((token: any) => ({
        id: token.id,
        userId: token.userId,
        token: token.token,
        expiresAt: token.expiresAt,
        used: token.used,
      }));
    } catch (error) {
      console.error('Error finding password reset tokens by user:', error);
      throw new DatabaseError('Failed to find password reset tokens');
    }
  }

  async markAsUsed(id: string): Promise<void> {
    try {
      await this.dbClient.passwordResetToken.update({
        where: { id },
        data: { used: true },
      });
    } catch (error) {
      console.error('Error marking password reset token as used:', error);
      throw new DatabaseError('Failed to mark password reset token as used');
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.dbClient.passwordResetToken.deleteMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Error deleting password reset tokens by user:', error);
      throw new DatabaseError('Failed to delete password reset tokens');
    }
  }

  async deleteExpiredTokens(): Promise<void> {
    try {
      await this.dbClient.passwordResetToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });
    } catch (error) {
      console.error('Error deleting expired password reset tokens:', error);
      throw new DatabaseError('Failed to delete expired password reset tokens');
    }
  }
}
