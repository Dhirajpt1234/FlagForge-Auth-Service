import type IEnvironmentRepository from '../IEnvironment.repository';
import type { EnvironmentData, EnvironmentUpdateData } from '../IEnvironment.repository';
import DatabaseClient from '../../Database/db.client';

export default class EnvironmentRepository implements IEnvironmentRepository {
  private dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();

  async create(data: EnvironmentData, organizationId: string, createdById: string): Promise<any> {
    return this.dbClient.environment.create({
      data: {
        ...data,
        organizationId,
        createdById,
      },
    });
  }

  async findById(id: string, organizationId: string): Promise<any | null> {
    return this.dbClient.environment.findFirst({
      where: {
        id,
        organizationId,
        isDeleted: false,
      },
    });
  }

  async findByOrganization(organizationId: string): Promise<any[]> {
    return this.dbClient.environment.findMany({
      where: {
        organizationId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(id: string, organizationId: string, data: EnvironmentUpdateData): Promise<any> {
    return this.dbClient.environment.update({
      where: {
        id,
        organizationId,
      },
      data,
    });
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.dbClient.environment.update({
      where: {
        id,
        organizationId,
      },
      data: {
        isDeleted: true,
      },
    });
  }

  async findByKey(key: string, organizationId: string): Promise<any | null> {
    return this.dbClient.environment.findFirst({
      where: {
        key,
        organizationId,
        isDeleted: false,
      },
    });
  }
}
