import type { Request, Response, NextFunction } from 'express';
import type ITokenService from '../Service/ITokenService';
import { UnauthorizedError, ValidationError } from './exceptionHandler.middleware';
import type IOrganizationMemberRepository from '../Repository/IOrganizationMember.repository';
import { OrgRole } from '../Types/OrgRole.enum';

export interface OrgContextRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: OrgRole;
  };
}

export const createOrgContextMiddleware = (
  tokenService: ITokenService,
  organizationMemberRepository: IOrganizationMemberRepository
) => {
  return async (req: OrgContextRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedError('Authorization header required');
      }

      const token = authHeader.startsWith('Bearer') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        throw new UnauthorizedError('Token required');
      }

      const payload = await tokenService.verifyAccessTokenWithOrg(token);
      
      let orgId = payload.orgId;
      let role = payload.role;

      if (req.headers['x-organization-id']) {
        const requestedOrgId = req.headers['x-organization-id'] as string;
        
        if (requestedOrgId !== orgId) {
          const membership = await organizationMemberRepository.findByUserAndOrg(payload.userId, requestedOrgId);
          
          if (!membership) {
            throw new UnauthorizedError('User is not a member of the requested organization');
          }
          
          orgId = requestedOrgId;
          role = membership.role as OrgRole;
        }
      } else if (req.query.orgId) {
        const requestedOrgId = req.query.orgId as string;
        
        if (requestedOrgId !== orgId) {
          const membership = await organizationMemberRepository.findByUserAndOrg(payload.userId, requestedOrgId);
          
          if (!membership) {
            throw new UnauthorizedError('User is not a member of the requested organization');
          }
          
          orgId = requestedOrgId;
          role = membership.role as OrgRole;
        }
      }

      req.user = {
        userId: payload.userId,
        orgId,
        role,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ValidationError) {
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

export default createOrgContextMiddleware;
