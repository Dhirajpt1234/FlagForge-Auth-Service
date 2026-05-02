import type IOrganizationRepository from '../IOrganization.repository';
import type OrganizationResponseDTO from '../../DTO/OrganizationResponse.dto';
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
      const organization = await this.dbClient.organization.findUnique({
        where: { slug },
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
          ...(excludeId && { id: { not: excludeId } }),
        },
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
        where: { id },
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
      console.error('Error finding organization by id:', error);
      throw new DatabaseError('Failed to find organization');
    }
  }
}
