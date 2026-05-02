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
}
