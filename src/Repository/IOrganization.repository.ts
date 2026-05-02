import type OrganizationResponseDTO from '../DTO/OrganizationResponse.dto';

export default interface IOrganizationRepository {
  create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<OrganizationResponseDTO>;
  
  findBySlug(slug: string): Promise<OrganizationResponseDTO | null>;
  
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  
  findById(id: string): Promise<OrganizationResponseDTO | null>;
}
