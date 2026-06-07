import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from './exceptionHandler.middleware';
import { OrgRole } from '../Types/OrgRole.enum';
import type { OrgContextRequest } from './orgContext.middleware';

const roleHierarchy = {
  [OrgRole.OWNER]: [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.WRITER, OrgRole.READER],
  [OrgRole.ADMIN]: [OrgRole.ADMIN, OrgRole.WRITER, OrgRole.READER],
  [OrgRole.WRITER]: [OrgRole.WRITER, OrgRole.READER],
  [OrgRole.READER]: [OrgRole.READER]
};

export function canInvite(userRole: OrgRole, targetRole: OrgRole): boolean {
  return roleHierarchy[userRole]?.includes(targetRole) ?? false;
}

export function canManageInvitations(userRole: OrgRole): boolean {
  return userRole === OrgRole.OWNER || userRole === OrgRole.ADMIN;
}

export const createRolePermissionMiddleware = (requiredRole?: OrgRole) => {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (requiredRole && !hasMinimumRole(req.user.role, requiredRole)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

export const createInvitationPermissionMiddleware = () => {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const userRole = req.user.role;
    
    if (!canManageInvitations(userRole)) {
      return next(new UnauthorizedError('Only owners and admins can manage invitations'));
    }

    next();
  };
};

export const validateInvitationRoleMiddleware = () => {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    const userRole = req.user.role;
    const { role } = req.body;

    if (!role || !Object.values(OrgRole).includes(role)) {
      return next(new UnauthorizedError('Invalid role specified'));
    }

    if (!canInvite(userRole, role)) {
      return next(new UnauthorizedError(`Cannot invite users with role ${role} or higher`));
    }

    next();
  };
};

export const createOwnerOnlyMiddleware = () => {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    if (req.user.role !== OrgRole.OWNER) {
      return next(new UnauthorizedError('Only organization owners can perform this action'));
    }

    next();
  };
};

function hasMinimumRole(userRole: OrgRole, minimumRole: OrgRole): boolean {
  const roleLevels = {
    [OrgRole.OWNER]: 4,
    [OrgRole.ADMIN]: 3,
    [OrgRole.WRITER]: 2,
    [OrgRole.READER]: 1
  };

  return roleLevels[userRole] >= roleLevels[minimumRole];
}

export { OrgRole };
