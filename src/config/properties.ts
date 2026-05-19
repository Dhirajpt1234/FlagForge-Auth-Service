import dotenv from 'dotenv'
dotenv.config();

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug';
export const APP_NAME = process.env.APP_NAME ?? 'flagforge-auth-service';
export const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development';
export const PORT = process.env.PORT ?? 3002;
export const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET';
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '180m';
export const REFRESH_TOKEN_EXPIRY_DAYS = process.env.REFRESH_TOKEN_EXPIRY_DAYS || '15';
export const INVITATION_EXPIRY_DAYS = process.env.INVITATION_EXPIRY_DAYS || '15';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@flagforge.com';
export const OK_STATUS = 'OK';
