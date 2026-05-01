export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'debug';
export const APP_NAME = process.env.APP_NAME ?? 'flagforge-auth-service'
export const ENVIRONMENT = process.env.ENVIRONMENT ?? 'development'
export const PORT = process.env.PORT ?? 3001;
export const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET';
export const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
export const REFRESH_TOKEN_EXPIRY_DAYS = process.env.REFRESH_TOKEN_EXPIRY_DAYS || 7;
export const OK_STATUS = 'OK';
