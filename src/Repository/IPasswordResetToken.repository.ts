export default interface IPasswordResetTokenRepository {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<{ id: string; userId: string; token: string; expiresAt: Date; used: boolean } | null>;
  findByUserId(userId: string): Promise<{ id: string; userId: string; token: string; expiresAt: Date; used: boolean }[]>;
  markAsUsed(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;
}
