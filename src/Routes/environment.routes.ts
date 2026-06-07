import { Router } from 'express';
import type IEnvironmentService from '../Service/IEnvironment.service';
import ITokenService from '../Service/ITokenService';
import EnvironmentRepository from '../Repository/concrete/Environment.repository';
import OrganizationRepository from '../Repository/concrete/Organization.repository';
import OrganizationMemberRepository from '../Repository/concrete/OrganizationMember.repository';
import EnvironmentService from '../Service/concrete/Environment.service';
import EnvironmentController from '../Controller/Environment.controller';
import TokenService from '../Service/concrete/Token.service';
import createAuthMiddleware from '../Middleware/auth.middleware';
import { createOwnerOnlyMiddleware } from '../Middleware/rolePermission.middleware';
import { createOrgContextMiddleware } from '../Middleware/orgContext.middleware';

const createEnvironmentRoutes = (): Router => {
  const router = Router();

  const tokenService: ITokenService = new TokenService();
  const environmentRepository = new EnvironmentRepository();
  const organizationRepository = new OrganizationRepository();
  const organizationMemberRepository = new OrganizationMemberRepository();
  const environmentService: IEnvironmentService = new EnvironmentService(
    environmentRepository,
    organizationRepository
  );
  const environmentController = new EnvironmentController(environmentService);
  const authMiddleware = createAuthMiddleware(tokenService);
  const orgContextMiddleware = createOrgContextMiddleware(tokenService, organizationMemberRepository);
  const ownerOnlyMiddleware = createOwnerOnlyMiddleware();

  router.post(
    '/:orgId/environments',
    authMiddleware,
    orgContextMiddleware,
    ownerOnlyMiddleware,
    environmentController.createEnvironment
  );

  router.get(
    '/:orgId/environments',
    authMiddleware,
    orgContextMiddleware,
    environmentController.getOrganizationEnvironments
  );

  router.get(
    '/:orgId/environments/:id',
    authMiddleware,
    orgContextMiddleware,
    environmentController.getEnvironmentById
  );

  router.put(
    '/:orgId/environments/:id',
    authMiddleware,
    orgContextMiddleware,
    ownerOnlyMiddleware,
    environmentController.updateEnvironment
  );

  router.delete(
    '/:orgId/environments/:id',
    authMiddleware,
    orgContextMiddleware,
    ownerOnlyMiddleware,
    environmentController.deleteEnvironment
  );

  return router;
};

export { createEnvironmentRoutes };
export default createEnvironmentRoutes;
