import { Router } from 'express';
import type IInvitationService from '../Service/IInvitationService';
import type IEmailService from '../Service/IEmailService';
import type IInvitationRepository from '../Repository/IInvitation.repository';
import type IOrganizationMemberRepository from '../Repository/IOrganizationMember.repository';
import type IUserService from '../Service/IUserService';
import type IPasswordService from '../Service/IPasswordService';
import type ITokenService from '../Service/ITokenService';
import type IRefreshTokenRepository from '../Repository/IRefreshToken.repository';
import { ConsoleEmailProvider } from '../Service/concrete/Email.service';
import { createOrgContextMiddleware } from '../Middleware/orgContext.middleware';
import { createInvitationPermissionMiddleware, validateInvitationRoleMiddleware } from '../Middleware/rolePermission.middleware';
import rateLimit from 'express-rate-limit';
import InvitationController from '../Controller/Invitation.controller';
import InvitationService from '../Service/concrete/Invitation.service';
import EmailService from '../Service/concrete/Email.service';
import InvitationRepository from '../Repository/concrete/Invitation.repository';
import OrganizationMemberRepository from '../Repository/concrete/OrganizationMember.repository';
import UserService from '../Service/concrete/User.service';
import PasswordService from '../Service/concrete/Password.service';
import TokenService from '../Service/concrete/Token.service';
import RefreshTokenRepository from '../Repository/concrete/RefreshToken.repository';
import UserRepository from '../Repository/concrete/User.repository';
import OrganizationRepository from '../Repository/concrete/Organization.repository';
import IOrganizationRepository from '../Repository/IOrganization.repository';

const createInvitationRoutes = (databaseUrl: string): Router => {
  const router = Router();

  // Initialize services
  const invitationRepository: IInvitationRepository = new InvitationRepository();
  const organizationMemberRepository: IOrganizationMemberRepository = new OrganizationMemberRepository();
  const userRepository = new UserRepository(databaseUrl);
  const userService: IUserService = new UserService(userRepository);
  const passwordService: IPasswordService = new PasswordService();
  const tokenService: ITokenService = new TokenService();
  const refreshTokenRepository: IRefreshTokenRepository = new RefreshTokenRepository(databaseUrl);
  const organizationRepository: IOrganizationRepository = new OrganizationRepository();
  
  // Initialize email service with console provider
  const emailService: IEmailService = new EmailService();

  // TODO : Remove console email logger provider later.
  emailService.addProvider('console', new ConsoleEmailProvider());

  // Initialize invitation service
  const invitationService: IInvitationService = new InvitationService(
    invitationRepository,
    organizationRepository,
    organizationMemberRepository,
    userService,
    passwordService,
    tokenService,
    emailService,
    refreshTokenRepository
  );

  const invitationController = new InvitationController(invitationService);
  const orgContextMiddleware = createOrgContextMiddleware(tokenService, organizationMemberRepository);

  // Rate limiting for invitation endpoints
  const invitationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 invitations per 15 minutes
    message: 'Too many invitation attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Public endpoints (no authentication required)
  router.get('/invitations/:invitationId', publicLimiter, invitationController.getInvitationByInvitationId);
  router.get('/invitations/token/:token', publicLimiter, invitationController.getInvitationByToken);
  router.post('/invitations/token/:token/accept', publicLimiter, invitationController.acceptInvitation);

  // Protected endpoints (requires organization context)
  router.post(
    '/organizations/:orgId/invitations',
    orgContextMiddleware,
    createInvitationPermissionMiddleware(),
    validateInvitationRoleMiddleware(),
    invitationLimiter,
    invitationController.createInvitation
  );
  
  router.get(
    '/organizations/:orgId/invitations',
    orgContextMiddleware,
    createInvitationPermissionMiddleware(),
    invitationController.listInvitations
  );
  
  router.delete(
    '/invitations/:invitationId',
    orgContextMiddleware,
    createInvitationPermissionMiddleware(),
    invitationController.revokeInvitation
  );
  
  router.post(
    '/invitations/:invitationId/resend',
    orgContextMiddleware,
    createInvitationPermissionMiddleware(),
    invitationController.resendInvitation
  );

  return router;
};

export { createInvitationRoutes };
export default createInvitationRoutes;
