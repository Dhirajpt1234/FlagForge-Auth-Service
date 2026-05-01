export default interface ITokenService {
  generateAccessToken(userId: string): Promise<string>;
  generateRefreshToken(): Promise<string>;
  verifyAccessToken(token: string): Promise<{ userId: string }>;
  hashToken(token: string): Promise<string>;
  generateTokenExpiry(days: number): Date;
  getRefreshTokenExpiry(): Date;
}
