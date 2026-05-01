import { Router } from 'express';
import type IAuthService from '../Service/IAuthService';
import type ITokenService from '../Service/ITokenService';
import type IPasswordService from '../Service/IPasswordService';
import type IUserService from '../Service/IUserService';
import type { default as IUserRepository } from '../Repository/IUser.repository';
import type { default as IRefreshTokenRepository } from '../Repository/IRefreshToken.repository';
import AuthController from '../Controller/Auth.controller';
import AuthService from '../Service/concrete/Auth.service';
import TokenService from '../Service/concrete/Token.service';
import PasswordService from '../Service/concrete/Password.service';
import UserService from '../Service/concrete/User.service';
import UserRepository from '../Repository/concrete/User.repository';
import RefreshTokenRepository from '../Repository/concrete/RefreshToken.repository';
import rateLimit from 'express-rate-limit';
import createAuthMiddleware from '../Middleware/auth.middleware';

const createAuthRoutes = (databaseUrl: string): Router => {
  const router = Router();

  const tokenService: ITokenService = new TokenService();
  const passwordService: IPasswordService = new PasswordService();
  
  const userRepository: IUserRepository = new UserRepository(databaseUrl);
  const refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepository(databaseUrl);
  
  const userService: IUserService = new UserService(userRepository);
  const authService: IAuthService = new AuthService(tokenService, passwordService, userService, refreshTokenRepository);
  const authController = new AuthController(authService);
  const authMiddleware = createAuthMiddleware(tokenService);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // v1 API endpoints
  router.post('/v1/signup', authLimiter, authController.signup);
  router.post('/v1/login', authLimiter, authController.login);
  router.post('/v1/refresh', authController.refreshToken);
  router.post('/v1/logout', authController.logout);
  router.get('/v1/profile', authMiddleware, authController.getProfile);

  return router;
};

export { createAuthRoutes };
export default createAuthRoutes;
