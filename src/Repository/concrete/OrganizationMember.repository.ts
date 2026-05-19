import type IOrganizationMemberRepository from '../IOrganizationMember.repository';
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
      const member = await this.dbClient.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            userId,
            organizationId,
          },
        },
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
        where: { userId },
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
        where: { organizationId },
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
}
