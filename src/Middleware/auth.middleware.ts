import type { Request, Response, NextFunction } from 'express';
import type ITokenService from '../Service/ITokenService';
import { UnauthorizedError } from './exceptionHandler.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    // TODO: Add orgId and role when org module is implemented
    // orgId?: string;
    // role?: string;
  };
}

const createAuthMiddleware = (tokenService: ITokenService) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedError('Authorization header required');
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        throw new UnauthorizedError('Token required');
      }

      const payload = await tokenService.verifyAccessToken(token);
      
      req.user = {
        userId: payload.userId,
        // TODO: Add orgId and role when org module is implemented
        // orgId: payload.orgId,
        // role: payload.role,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return next(error);
      }
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return next(new UnauthorizedError('Token expired'));
        }
        if (error.message.includes('invalid') || error.message.includes('verification')) {
          return next(new UnauthorizedError('Invalid token'));
        }
      }
      
      return next(new UnauthorizedError('Authentication failed'));
    }
  };
};

export default createAuthMiddleware;
