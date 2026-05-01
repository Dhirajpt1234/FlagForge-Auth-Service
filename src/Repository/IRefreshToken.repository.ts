export default interface IRefreshTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<{ id: string; userId: string; tokenHash: string; expiresAt: Date } | null>;
  findValidTokens(): Promise<{ id: string; userId: string; tokenHash: string; expiresAt: Date }[]>;
  deleteById(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
