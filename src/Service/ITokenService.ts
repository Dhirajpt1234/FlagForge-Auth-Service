import { OrgRole } from '../Types/OrgRole.enum';

export default interface ITokenService {
  generateAccessToken(userId: string): Promise<string>;
  generateAccessTokenWithOrg(userId: string, orgId: string, role: OrgRole): Promise<string>;
  generateRefreshToken(): Promise<string>;
  verifyAccessToken(token: string): Promise<{ userId: string }>;
  verifyAccessTokenWithOrg(token: string): Promise<{ userId: string; orgId: string; role: OrgRole }>;
  hashToken(token: string): Promise<string>;
  generateTokenExpiry(days: number): Date;
  getRefreshTokenExpiry(): Date;
}
