import type IInvitationRepository from '../IInvitation.repository';
import DatabaseClient from '../../Database/db.client';
import { DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaClient, InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { OrgRole } from '../../Types/OrgRole.enum';

export default class InvitationRepository implements IInvitationRepository {
  private dbClient: PrismaClient;

  constructor() {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(data: {
    organizationId: string;
    email: string;
    role: string;
    token: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
  }> {
    try {
      const invitation = await this.dbClient.invitation.create({
        data: {
          organizationId: data.organizationId,
          email: data.email,
          role: data.role as OrgRole,
          token: data.token,
          invitedById: data.invitedById,
          expiresAt: data.expiresAt,
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          token: true,
          status: true,
          invitedById: true,
          expiresAt: true,
          createdAt: true,
        },
      });
      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw new DatabaseError('Failed to create invitation');
    }
  }

  async findByInvitationId(invitationId: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null> {
    try {
      const invitation = await this.dbClient.invitation.findUnique({
        where: { id: invitationId },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          token: true,
          status: true,
          invitedById: true,
          expiresAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      
      return invitation;
    } catch (error) {
      console.error('Error finding invitation by invitation ID:', error);
      throw new DatabaseError('Failed to find invitation');
    }
  }

  async findByToken(token: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  } | null> {
    try {
      const invitation = await this.dbClient.invitation.findUnique({
        where: { token },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          token: true,
          status: true,
          invitedById: true,
          expiresAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      
      return invitation;
    } catch (error) {
      console.error('Error finding invitation by token:', error);
      throw new DatabaseError('Failed to find invitation');
    }
  }

  async findByOrgAndEmail(organizationId: string, email: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
  } | null> {
    try {
      const invitation = await this.dbClient.invitation.findFirst({
        where: {
          organizationId,
          email,
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          token: true,
          status: true,
          invitedById: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return invitation;
    } catch (error) {
      console.error('Error finding invitation by org and email:', error);
      throw new DatabaseError('Failed to find invitation');
    }
  }

  async findByOrganization(organizationId: string, status?: string): Promise<{
    id: string;
    organizationId: string;
    email: string;
    role: string;
    token: string;
    status: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    invitedBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }[]> {
    try {
      const whereClause = status 
        ? { organizationId, status: status as InvitationStatus }
        : { organizationId };

      const invitations = await this.dbClient.invitation.findMany({
        where: whereClause,
        select: {
          id: true,
          organizationId: true,
          email: true,
          role: true,
          token: true,
          status: true,
          invitedById: true,
          expiresAt: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return invitations;
    } catch (error) {
      console.error('Error finding invitations by organization:', error);
      throw new DatabaseError('Failed to find invitations');
    }
  }

  async updateStatus(id: string, status: string): Promise<void> {
    try {
      await this.dbClient.invitation.update({
        where: { id },
        data: { 
          status: status as InvitationStatus,
          acceptedAt: status === InvitationStatus.ACCEPTED ? new Date() : undefined,
        },
      });
    } catch (error) {
      console.error('Error updating invitation status:', error);
      throw new DatabaseError('Failed to update invitation status');
    }
  }

  async deleteById(id: string): Promise<void> {
    try {
      await this.dbClient.invitation.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw new DatabaseError('Failed to delete invitation');
    }
  }

  async findExpiredInvitations(): Promise<{
    id: string;
    organizationId: string;
    email: string;
    token: string;
  }[]> {
    try {
      const invitations = await this.dbClient.invitation.findMany({
        where: {
          status: InvitationStatus.PENDING,
          expiresAt: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          organizationId: true,
          email: true,
          token: true,
        },
      });
      return invitations;
    } catch (error) {
      console.error('Error finding expired invitations:', error);
      throw new DatabaseError('Failed to find expired invitations');
    }
  }
}
