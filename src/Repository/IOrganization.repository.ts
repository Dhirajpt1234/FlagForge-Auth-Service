import type OrganizationResponseDTO from '../DTO/OrganizationResponse.dto';
import type OrganizationListResponseDTO from '../DTO/OrganizationListResponse.dto';

export default interface IOrganizationRepository {
  create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<OrganizationResponseDTO>;
  
  findBySlug(slug: string): Promise<OrganizationResponseDTO | null>;
  
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  
  findById(id: string): Promise<OrganizationResponseDTO | null>;

  findByUserId(userId: string): Promise<OrganizationListResponseDTO[]>;

  findAll(): Promise<OrganizationResponseDTO[]>;

  update(orgId: string, data: {
    name?: string;
    slug?: string;
  }): Promise<OrganizationResponseDTO>;

  softDelete(orgId: string): Promise<void>;
}
