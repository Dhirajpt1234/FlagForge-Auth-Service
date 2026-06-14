import { Router } from 'express';
import type IAuthService from '../Service/IAuthService';
import type ITokenService from '../Service/ITokenService';
import type IPasswordService from '../Service/IPasswordService';
import type IUserService from '../Service/IUserService';
import type { default as IUserRepository } from '../Repository/IUser.repository';
import type { default as IRefreshTokenRepository } from '../Repository/IRefreshToken.repository';
import type IPasswordResetTokenRepository from '../Repository/IPasswordResetToken.repository';
import IOrganizationRepository from '../Repository/IOrganization.repository';
import IOrganizationMemberRepository from '../Repository/IOrganizationMember.repository';
import AuthController from '../Controller/Auth.controller';
import AuthService from '../Service/concrete/Auth.service';
import TokenService from '../Service/concrete/Token.service';
import PasswordService from '../Service/concrete/Password.service';
import UserService from '../Service/concrete/User.service';
import UserRepository from '../Repository/concrete/User.repository';
import RefreshTokenRepository from '../Repository/concrete/RefreshToken.repository';
import PasswordResetTokenRepository from '../Repository/concrete/PasswordResetToken.repository';
import OrganizationRepository from '../Repository/concrete/Organization.repository';
import OrganizationMemberRepository from '../Repository/concrete/OrganizationMember.repository';
import rateLimit from 'express-rate-limit';
import createAuthMiddleware from '../Middleware/auth.middleware';
import { createInvitationRoutes } from './invitation.routes';

const createAuthRoutes = (databaseUrl: string): Router => {
  const router = Router();

  const tokenService: ITokenService = new TokenService();
  const passwordService: IPasswordService = new PasswordService();
  
  const userRepository: IUserRepository = new UserRepository(databaseUrl);
  const refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepository(databaseUrl);
  const passwordResetTokenRepository: IPasswordResetTokenRepository = new PasswordResetTokenRepository(databaseUrl);
  const organizationRepository: IOrganizationRepository = new OrganizationRepository();
  const organizationMemberRepository: IOrganizationMemberRepository = new OrganizationMemberRepository();
  
  const userService: IUserService = new UserService(userRepository);
  const authService: IAuthService = new AuthService(tokenService, passwordService, userService, refreshTokenRepository, passwordResetTokenRepository, organizationRepository, organizationMemberRepository);
  const authController = new AuthController(authService);
  const authMiddleware = createAuthMiddleware(tokenService);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Too many password reset attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // v1 API endpoints
  router.post('/v1/signup', authLimiter, authController.signup);
  router.post('/v1/login', authLimiter, authController.login);
  router.post('/v1/refresh', authController.refreshToken);
  router.post('/v1/logout', authController.logout);
  router.get('/v1/profile', authMiddleware, authController.getProfile);
  router.post('/v1/forgot-password', passwordResetLimiter, authController.forgotPassword);
  router.post('/v1/reset-password', passwordResetLimiter, authController.resetPassword);

  // Add invitation routes
  const invitationRoutes = createInvitationRoutes(databaseUrl);
  router.use('/v1', invitationRoutes);

  return router;
};

export { createAuthRoutes };
export default createAuthRoutes;
