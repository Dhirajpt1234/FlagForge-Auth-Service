import type IEnvironmentService from '../IEnvironment.service';
import type IEnvironmentRepository from '../../Repository/IEnvironment.repository';
import type IOrganizationRepository from '../../Repository/IOrganization.repository';
import type EnvironmentResponseDTO from '../../DTO/EnvironmentResponse.dto';
import type EnvironmentListResponseDTO from '../../DTO/EnvironmentListResponse.dto';
import type EnvironmentCreationDataDTO from '../../DTO/EnvironmentCreationData.dto';
import type EnvironmentUpdateRequestDTO from '../../DTO/EnvironmentUpdateRequest.dto';
import { UnauthorizedError, NotFoundError, ConflictError } from '../../Middleware/exceptionHandler.middleware';
import { OrgRole } from '../../Types/OrgRole.enum';

export default class EnvironmentService implements IEnvironmentService {
  private environmentRepository: IEnvironmentRepository;
  private organizationRepository: IOrganizationRepository;

  constructor(environmentRepository: IEnvironmentRepository, organizationRepository: IOrganizationRepository) {
    this.environmentRepository = environmentRepository;
    this.organizationRepository = organizationRepository;
  }

  async createEnvironment(dto: EnvironmentCreationDataDTO, organizationId: string, userId: string): Promise<EnvironmentResponseDTO> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new UnauthorizedError('Only organization owners can create environments');
    }

    const existingByKey = await this.environmentRepository.findByKey(dto.key, organizationId);
    if (existingByKey) {
      throw new ConflictError('Environment with this key already exists');
    }

    const environment = await this.environmentRepository.create(dto, organizationId, userId);

    return this.mapToResponseDTO(environment);
  }

  async getEnvironmentById(id: string, organizationId: string, userId: string): Promise<EnvironmentResponseDTO> {
    const environment = await this.environmentRepository.findById(id, organizationId);
    if (!environment) {
      throw new NotFoundError('Environment not found');
    }

    return this.mapToResponseDTO(environment);
  }

  async getOrganizationEnvironments(organizationId: string, userId: string): Promise<EnvironmentListResponseDTO> {
    const environments = await this.environmentRepository.findByOrganization(organizationId);

    return {
      environments: environments.map((env: any) => this.mapToResponseDTO(env)),
      total: environments.length,
    };
  }

  async updateEnvironment(id: string, organizationId: string, userId: string, dto: EnvironmentUpdateRequestDTO): Promise<EnvironmentResponseDTO> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new UnauthorizedError('Only organization owners can update environments');
    }

    const environment = await this.environmentRepository.findById(id, organizationId);
    if (!environment) {
      throw new NotFoundError('Environment not found');
    }

    if (dto.name && dto.name !== environment.name) {
      const existingByName = await this.environmentRepository.findByOrganization(organizationId);
      const nameExists = existingByName.some((env: any) => env.name === dto.name && env.id !== id);
      if (nameExists) {
        throw new ConflictError('Environment with this name already exists');
      }
    }

    const updatedEnvironment = await this.environmentRepository.update(id, organizationId, dto);

    return this.mapToResponseDTO(updatedEnvironment);
  }

  async deleteEnvironment(id: string, organizationId: string, userId: string): Promise<void> {
    const organization = await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    if (organization.ownerId !== userId) {
      throw new UnauthorizedError('Only organization owners can delete environments');
    }

    const environment = await this.environmentRepository.findById(id, organizationId);
    if (!environment) {
      throw new NotFoundError('Environment not found');
    }

    await this.environmentRepository.delete(id, organizationId);
  }

  private mapToResponseDTO(environment: any): EnvironmentResponseDTO {
    return {
      id: environment.id,
      organizationId: environment.organizationId,
      name: environment.name,
      key: environment.key,
      description: environment.description,
      isDefault: environment.isDefault,
      createdById: environment.createdById,
      createdAt: environment.createdAt.toISOString(),
      updatedAt: environment.updatedAt.toISOString(),
    };
  }
}
