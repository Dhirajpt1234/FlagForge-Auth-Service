import { Router } from 'express';
import type IOrganizationService from '../Service/IOrganizationService';
import ITokenService from '../Service/ITokenService';
import OrganizationRepository from '../Repository/concrete/Organization.repository';
import OrganizationMemberRepository from '../Repository/concrete/OrganizationMember.repository';
import OrganizationService from '../Service/concrete/Organization.service';
import OrganizationController from '../Controller/Organization.controller';
import TokenService from '../Service/concrete/Token.service';
import createAuthMiddleware from '../Middleware/auth.middleware';
import { createRolePermissionMiddleware } from '../Middleware/rolePermission.middleware';
import { OrgRole } from '../Types/OrgRole.enum';

const createOrganizationRoutes = (): Router => {
  const router = Router();

  // Initialize services and repositories
  const tokenService: ITokenService = new TokenService();
  const organizationRepository = new OrganizationRepository();
  const organizationMemberRepository = new OrganizationMemberRepository();
  const organizationService: IOrganizationService = new OrganizationService(
    organizationRepository,
    organizationMemberRepository
  );
  const organizationController = new OrganizationController(organizationService);
  const authMiddleware = createAuthMiddleware(tokenService);

  // Middleware for admin/owner permissions
  const adminOrOwnerMiddleware = createRolePermissionMiddleware(OrgRole.ADMIN);
  
  // NOTE: This endpoint should not be used - organizations are created during user signup
  router.post('/v1/organizations', authMiddleware, organizationController.createOrganization);

  // Get all organizations for the authenticated user is part of.
  router.get('/v1/organizations', authMiddleware, organizationController.getUserOrganizations);

  // Get all organizations (admin endpoint)
  // TODO : add authMiddleware later.
  router.get('/v1/organizations/all', organizationController.getAllOrganizations);

  // Get specific organization details
  router.get('/v1/organizations/:id', authMiddleware, organizationController.getOrganizationById);

  // Update organization (owner or admin only)
  router.put('/v1/organizations/:id', authMiddleware, adminOrOwnerMiddleware, organizationController.updateOrganization);

  // Delete organization (owner only - enforced in service layer)
  router.delete('/v1/organizations/:id', authMiddleware, adminOrOwnerMiddleware, organizationController.deleteOrganization);

  // Get organization members (all members can view)
  router.get('/v1/organizations/:id/members', authMiddleware, organizationController.getOrganizationMembers);

  // Update member role (owner or admin only - permissions enforced in service layer)
  router.put('/v1/organizations/:id/members/:userId', authMiddleware, adminOrOwnerMiddleware, organizationController.updateMemberRole);

  // Remove member (owner or admin only - permissions enforced in service layer)
  router.delete('/v1/organizations/:id/members/:userId', authMiddleware, adminOrOwnerMiddleware, organizationController.removeMember);

  // Exit organization (any member can exit - permissions enforced in service layer)
  router.post('/v1/organizations/:id/exit', authMiddleware, organizationController.exitOrganization);

  return router;
};

export { createOrganizationRoutes };
export default createOrganizationRoutes;
