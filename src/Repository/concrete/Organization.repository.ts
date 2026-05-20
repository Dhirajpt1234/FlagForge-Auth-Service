import type IOrganizationRepository from '../IOrganization.repository';
import type OrganizationResponseDTO from '../../DTO/OrganizationResponse.dto';
import type OrganizationListResponseDTO from '../../DTO/OrganizationListResponse.dto';
import DatabaseClient from '../../Database/db.client';
import { ConflictError, NotFoundError, DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaDatabaseClient } from '../../Database/PrismaDatabase.client';
import { PrismaClient } from '@prisma/client';

export default class OrganizationRepository implements IOrganizationRepository {
  private dbClient: PrismaClient;

  constructor() {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<OrganizationResponseDTO> {
    try {
      const organization = await this.dbClient.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          ownerId: data.ownerId,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw new DatabaseError('Failed to create organization');
    }
  }

  async findBySlug(slug: string): Promise<OrganizationResponseDTO | null> {
    try {
      const organization = await this.dbClient.organization.findFirst({
        where: { slug, isDeleted: false } as any,
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!organization) return null;

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error finding organization by slug:', error);
      throw new DatabaseError('Failed to find organization');
    }
  }

  async slugExists(slug: string, excludeId?: string): Promise<boolean> {
    try {
      const existing = await this.dbClient.organization.findFirst({
        where: {
          slug,
          isDeleted: false,
          ...(excludeId && { id: { not: excludeId } }),
        } as any,
        select: { id: true },
      });

      return !!existing;
    } catch (error) {
      console.error('Error checking slug existence:', error);
      throw new DatabaseError('Failed to check slug existence');
    }
  }

  async findById(id: string): Promise<OrganizationResponseDTO | null> {
    try {
      const organization = await this.dbClient.organization.findUnique({
        where: { id, isDeleted: false } as any,
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      console.log('Organization found:', organization);

      if (!organization) return null;

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error finding organization by id:', error);
      throw new DatabaseError('Failed to find organization');
    }
  }

  async findByUserId(userId: string): Promise<OrganizationListResponseDTO[]> {
    try {
      const organizations = await this.dbClient.organization.findMany({
        where: {
          isDeleted: false,
          members: {
            some: {
              userId,
              isDeleted: false,
            },
          },
        } as any,
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          members: {
            where: {
              userId,
              isDeleted: false,
            },
            select: {
              role: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      return organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerId: org.ownerId,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        role: org.members?.[0]?.role || 'READER',
        memberCount: org._count?.members || 0,
      }));
    } catch (error) {
      console.error('Error finding organizations by user:', error);
      throw new DatabaseError('Failed to find user organizations');
    }
  }

  async findAll(): Promise<OrganizationResponseDTO[]> {
    try {
      const organizations = await this.dbClient.organization.findMany({
        where: { isDeleted: false } as any,
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerId: org.ownerId,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
      }));
    } catch (error) {
      console.error('Error finding all organizations:', error);
      throw new DatabaseError('Failed to find all organizations');
    }
  }

  async update(orgId: string, data: {
    name?: string;
    slug?: string;
  }): Promise<OrganizationResponseDTO> {
    try {
      const organization = await this.dbClient.organization.update({
        where: { id: orgId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.slug && { slug: data.slug }),
        } as any,
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      };
    } catch (error) {
      console.error('Error updating organization:', error);
      throw new DatabaseError('Failed to update organization');
    }
  }

  async softDelete(orgId: string): Promise<void> {
    try {
      // Soft delete all memberships
      await this.dbClient.organizationMember.updateMany({
        where: { organizationId: orgId },
        data: { isDeleted: true } as any,
      });

      // Soft delete environments
      await this.dbClient.environment.updateMany({
        where: { organizationId: orgId },
        data: { isDeleted: true } as any,
      });

      // Archive all feature flags
      await this.dbClient.featureFlag.updateMany({
        where: { organizationId: orgId },
        data: { archived: true },
      });

      // Revoke all pending invitations
      await this.dbClient.invitation.updateMany({
        where: { 
          organizationId: orgId,
          status: 'PENDING',
        },
        data: { status: 'REVOKED' },
      });

      // Finally, soft delete the organization
      await this.dbClient.organization.update({
        where: { id: orgId },
        data: { isDeleted: true } as any,
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw new DatabaseError('Failed to delete organization');
    }
  }
}
