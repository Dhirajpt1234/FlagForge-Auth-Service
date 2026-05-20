import type IOrganizationMemberRepository from '../IOrganizationMember.repository';
import type OrganizationMemberResponseDTO from '../../DTO/OrganizationMemberResponse.dto';
import DatabaseClient from '../../Database/db.client';
import { DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaClient } from '@prisma/client';
import { type OrgRole } from '../../Types/OrgRole.enum';

export default class OrganizationMemberRepository implements IOrganizationMemberRepository {
  private dbClient: PrismaClient;

  constructor() {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(data: {
    organizationId: string;
    userId: string;
    role: OrgRole;
  }): Promise<void> {
    try {
      await this.dbClient.organizationMember.create({
        data: {
          organizationId: data.organizationId,
          userId: data.userId,
          role: data.role,
        },
      });
    } catch (error) {
      console.error('Error creating organization member:', error);
      throw new DatabaseError('Failed to create organization member');
    }
  }

  async findByUserAndOrg(userId: string, organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string } | null> {
    try {
      const member = await this.dbClient.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          isDeleted: false,
        } as any,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
        },
      });
      return member;
    } catch (error) {
      console.error('Error finding organization member:', error);
      throw new DatabaseError('Failed to find organization member');
    }
  }

  async findByUserId(userId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]> {
    try {
      const members = await this.dbClient.organizationMember.findMany({
        where: { userId, isDeleted: false } as any,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
        },
      });
      return members;
    } catch (error) {
      console.error('Error finding user memberships:', error);
      throw new DatabaseError('Failed to find user memberships');
    }
  }

  async findByOrgId(organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]> {
    try {
      const members = await this.dbClient.organizationMember.findMany({
        where: { organizationId, isDeleted: false } as any,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
        },
      });
      return members;
    } catch (error) {
      console.error('Error finding organization members:', error);
      throw new DatabaseError('Failed to find organization members');
    }
  }

  async findWithUserInfo(organizationId: string): Promise<OrganizationMemberResponseDTO[]> {
    try {
      const members = await this.dbClient.organizationMember.findMany({
        where: { organizationId, isDeleted: false } as any,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return members.map(member => ({
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        },
      }));
    } catch (error) {
      console.error('Error finding organization members with user info:', error);
      throw new DatabaseError('Failed to find organization members with user info');
    }
  }

  async findByUserAndOrgWithDetails(userId: string, organizationId: string): Promise<OrganizationMemberResponseDTO | null> {
    try {
      const member = await this.dbClient.organizationMember.findFirst({
        where: {
          userId,
          organizationId,
          isDeleted: false,
        } as any,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!member) return null;

      return {
        id: member.id,
        organizationId: member.organizationId,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        },
      };
    } catch (error) {
      console.error('Error finding organization member with details:', error);
      throw new DatabaseError('Failed to find organization member with details');
    }
  }

  async updateRole(organizationId: string, userId: string, role: OrgRole): Promise<void> {
    try {
      await this.dbClient.organizationMember.updateMany({
        where: {
          organizationId,
          userId,
          isDeleted: false,
        } as any,
        data: { role },
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      throw new DatabaseError('Failed to update member role');
    }
  }

  async remove(organizationId: string, userId: string): Promise<void> {
    try {
      await this.dbClient.organizationMember.updateMany({
        where: {
          organizationId,
          userId,
          isDeleted: false,
        } as any,
        data: { isDeleted: true },
      });
    } catch (error) {
      console.error('Error removing organization member:', error);
      throw new DatabaseError('Failed to remove organization member');
    }
  }

  async removeAllByOrgId(organizationId: string): Promise<void> {
    try {
      await this.dbClient.organizationMember.updateMany({
        where: { organizationId, isDeleted: false } as any,
        data: { isDeleted: true },
      });
    } catch (error) {
      console.error('Error removing all organization members:', error);
      throw new DatabaseError('Failed to remove all organization members');
    }
  }
}
