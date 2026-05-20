import type OrganizationResponseDTO from '../DTO/OrganizationResponse.dto';
import type OrganizationListResponseDTO from '../DTO/OrganizationListResponse.dto';
import type OrganizationUpdateRequestDTO from '../DTO/OrganizationUpdateRequest.dto';
import type OrganizationMemberResponseDTO from '../DTO/OrganizationMemberResponse.dto';
import type MemberRoleUpdateRequestDTO from '../DTO/MemberRoleUpdateRequest.dto';
import type OrganizationCreationDataDTO from '../DTO/OrganizationCreationData.dto';
import { OrgRole } from '../Types/OrgRole.enum';

export default interface IOrganizationService {
  createOrganization(data: OrganizationCreationDataDTO, userId: string): Promise<OrganizationResponseDTO>;
  
  getUserOrganizations(userId: string): Promise<OrganizationListResponseDTO[]>;
  
  getOrganizationById(orgId: string, userId: string): Promise<OrganizationResponseDTO>;
  
  getAllOrganizations(): Promise<OrganizationResponseDTO[]>;
  
  updateOrganization(orgId: string, userId: string, data: OrganizationUpdateRequestDTO): Promise<OrganizationResponseDTO>;
  
  deleteOrganization(orgId: string, userId: string): Promise<void>;
  
  getOrganizationMembers(orgId: string, userId: string): Promise<OrganizationMemberResponseDTO[]>;
  
  updateMemberRole(orgId: string, userId: string, targetUserId: string, newRole: OrgRole): Promise<OrganizationMemberResponseDTO>;
  
  removeMember(orgId: string, userId: string, targetUserId: string): Promise<void>;
  
  exitOrganization(orgId: string, userId: string): Promise<void>;
}
