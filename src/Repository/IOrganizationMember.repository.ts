import type OrganizationMemberResponseDTO from '../DTO/OrganizationMemberResponse.dto';
import { type OrgRole } from '../Types/OrgRole.enum';

export default interface IOrganizationMemberRepository {
  create(data: {
    organizationId: string;
    userId: string;
    role: OrgRole;
  }): Promise<void>;
  findByUserAndOrg(userId: string, organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string } | null>;
  findByUserId(userId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]>;
  findByOrgId(organizationId: string): Promise<{ id: string; organizationId: string; userId: string; role: string }[]>;
  
  findWithUserInfo(organizationId: string): Promise<OrganizationMemberResponseDTO[]>;
  
  findByUserAndOrgWithDetails(userId: string, organizationId: string): Promise<OrganizationMemberResponseDTO | null>;
  
  updateRole(organizationId: string, userId: string, role: OrgRole): Promise<void>;
  
  remove(organizationId: string, userId: string): Promise<void>;
  
  removeAllByOrgId(organizationId: string): Promise<void>;
}
