import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type ITokenService from '../ITokenService';
import { ACCESS_TOKEN_EXPIRY, JWT_SECRET, REFRESH_TOKEN_EXPIRY_DAYS } from '../../config/properties';

export default class TokenService implements ITokenService {
  private readonly jwtSecret: Secret;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;
  private readonly HS256algorithm: jwt.Algorithm;

  constructor() {
    this.jwtSecret = JWT_SECRET;
    this.accessTokenExpiry = ACCESS_TOKEN_EXPIRY;
    this.refreshTokenExpiryDays = Number(REFRESH_TOKEN_EXPIRY_DAYS);
    this.HS256algorithm = 'HS256';
  }

  async generateAccessToken(userId: string): Promise<string> {
    const payload = {
      userId,
      iat: Math.floor(Date.now() / 1000),
    };

    const expiresIn = parseInt(this.accessTokenExpiry);

    const options: jwt.SignOptions = {
      expiresIn,
      algorithm: this.HS256algorithm,
    };

    return jwt.sign(payload, this.jwtSecret, options);
  }

  async generateRefreshToken(): Promise<string> {
    return uuidv4();
  }

  async verifyAccessToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, { algorithms: [this.HS256algorithm] }) as any;
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  async hashToken(token: string): Promise<string> {
    return await bcrypt.hash(token, 10);
  }

  generateTokenExpiry(days: number): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  getRefreshTokenExpiry(): Date {
    return this.generateTokenExpiry(this.refreshTokenExpiryDays);
  }
}
