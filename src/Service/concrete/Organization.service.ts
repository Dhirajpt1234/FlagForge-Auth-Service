import type IOrganizationService from '../IOrganizationService';
import type IOrganizationRepository from '../../Repository/IOrganization.repository';
import type IOrganizationMemberRepository from '../../Repository/IOrganizationMember.repository';
import type OrganizationResponseDTO from '../../DTO/OrganizationResponse.dto';
import type OrganizationListResponseDTO from '../../DTO/OrganizationListResponse.dto';
import type OrganizationUpdateRequestDTO from '../../DTO/OrganizationUpdateRequest.dto';
import type OrganizationMemberResponseDTO from '../../DTO/OrganizationMemberResponse.dto';
import type OrganizationCreationDataDTO from '../../DTO/OrganizationCreationData.dto';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError, DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { OrgRole } from '../../Types/OrgRole.enum';
import logger from '../../Utils/logger.util';

export default class OrganizationService implements IOrganizationService {
  private organizationRepository: IOrganizationRepository;
  private organizationMemberRepository: IOrganizationMemberRepository;

  constructor(
    organizationRepository: IOrganizationRepository,
    organizationMemberRepository: IOrganizationMemberRepository
  ) {
    this.organizationRepository = organizationRepository;
    this.organizationMemberRepository = organizationMemberRepository;
  }

  // Don't use this api. use singup api to create organization
  async createOrganization(data: OrganizationCreationDataDTO, userId: string): Promise<OrganizationResponseDTO> {
    const { name, slug, ownerId } = data;

    // Validation
    if (!name || !slug || !ownerId) {
      throw new ValidationError('Name, slug, and ownerId are required');
    }

    // Check if slug exists
    const slugExists = await this.organizationRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError('Organization slug already exists');
    }

    // Create organization
    const organization = await this.organizationRepository.create({
      name,
      slug,
      ownerId,
    });

    // Add owner as member
    await this.organizationMemberRepository.create({
      organizationId: organization.id,
      userId: ownerId,
      role: OrgRole.OWNER,
    });

    logger.info('Organization created', { orgId: organization.id, ownerId });

    return organization;
  }

  async getUserOrganizations(userId: string): Promise<OrganizationListResponseDTO[]> {
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    return await this.organizationRepository.findByUserId(userId);
  }

  async getOrganizationById(orgId: string, userId: string): Promise<OrganizationResponseDTO> {
    const organization = await this.organizationRepository.findById(orgId);
    
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Check if user is a member of this organization
    const userMembership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!userMembership) {
      throw new UnauthorizedError('You are not a member of this organization');
    }

    return organization;
  }

  async getAllOrganizations(): Promise<OrganizationResponseDTO[]> {
    try {
      const organizations = await this.organizationRepository.findAll();
      return organizations;
    } catch (error) {
      logger.error('Error getting all organizations:', error);
      throw new DatabaseError('Failed to retrieve organizations');
    }
  }

  async updateOrganization(orgId: string, userId: string, data: OrganizationUpdateRequestDTO): Promise<OrganizationResponseDTO> {
    if (!orgId || !userId) {
      throw new ValidationError('Organization ID and user ID are required');
    }

    // Check if user is owner or admin
    const membership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!membership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    const userRole = membership.role as OrgRole;
    if (userRole !== OrgRole.OWNER && userRole !== OrgRole.ADMIN) {
      throw new UnauthorizedError('Only owners and admins can update organization');
    }

    // Check if new slug exists (if updating slug)
    if (data.slug) {
      const slugExists = await this.organizationRepository.slugExists(data.slug, orgId);
      if (slugExists) {
        throw new ConflictError('Organization slug already exists');
      }
    }

    const organization = await this.organizationRepository.update(orgId, data);

    logger.info('Organization updated', { orgId, userId, data });

    return organization;
  }

  async deleteOrganization(orgId: string, userId: string): Promise<void> {
    if (!orgId || !userId) {
      throw new ValidationError('Organization ID and user ID are required');
    }

    // Check if user is owner
    const membership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!membership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    if (membership.role !== OrgRole.OWNER) {
      throw new UnauthorizedError('Only owners can delete organization');
    }

    await this.organizationRepository.softDelete(orgId);

    logger.info('Organization deleted', { orgId, userId });
  }

  async getOrganizationMembers(orgId: string, userId: string): Promise<OrganizationMemberResponseDTO[]> {
    if (!orgId || !userId) {
      throw new ValidationError('Organization ID and user ID are required');
    }

    // Check if user is a member
    const membership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!membership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    return await this.organizationMemberRepository.findWithUserInfo(orgId);
  }

  async updateMemberRole(orgId: string, userId: string, targetUserId: string, newRole: OrgRole): Promise<OrganizationMemberResponseDTO> {
    if (!orgId || !userId || !targetUserId || !newRole) {
      throw new ValidationError('Organization ID, user ID, target user ID, and new role are required');
    }

    // Check if requester is owner or admin
    const requesterMembership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!requesterMembership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    const requesterRole = requesterMembership.role as OrgRole;
    
    // Check permissions
    if (requesterRole === OrgRole.OWNER) {
      // Owner can update any role
    } else if (requesterRole === OrgRole.ADMIN) {
      // Admin can only update WRITER and READER roles
      if (newRole === OrgRole.OWNER || newRole === OrgRole.ADMIN) {
        throw new UnauthorizedError('Admins can only assign WRITER or READER roles');
      }
    } else {
      throw new UnauthorizedError('Only owners and admins can update member roles');
    }

    // Check if target user is a member
    const targetMembership = await this.organizationMemberRepository.findByUserAndOrgWithDetails(targetUserId, orgId);
    if (!targetMembership) {
      throw new NotFoundError('Target user is not a member of this organization');
    }

    // Prevent admins from modifying owners
    if (requesterRole === OrgRole.ADMIN && targetMembership.role === OrgRole.OWNER) {
      throw new UnauthorizedError('Admins cannot modify owner roles');
    }

    // Update the role
    await this.organizationMemberRepository.updateRole(orgId, targetUserId, newRole);

    // Get updated member details
    const updatedMember = await this.organizationMemberRepository.findByUserAndOrgWithDetails(targetUserId, orgId);
    if (!updatedMember) {
      throw new NotFoundError('Updated member not found');
    }

    logger.info('Member role updated', { orgId, userId, targetUserId, newRole });

    return updatedMember;
  }

  async removeMember(orgId: string, userId: string, targetUserId: string): Promise<void> {
    if (!orgId || !userId || !targetUserId) {
      throw new ValidationError('Organization ID, user ID, and target user ID are required');
    }

    // Check if requester is owner or admin
    const requesterMembership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!requesterMembership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    const requesterRole = requesterMembership.role as OrgRole;
    if (requesterRole !== OrgRole.OWNER && requesterRole !== OrgRole.ADMIN) {
      throw new UnauthorizedError('Only owners and admins can remove members');
    }

    // Check if target user is a member
    const targetMembership = await this.organizationMemberRepository.findByUserAndOrg(targetUserId, orgId);
    if (!targetMembership) {
      throw new NotFoundError('Target user is not a member of this organization');
    }

    // Prevent admins from removing owners
    if (requesterRole === OrgRole.ADMIN && targetMembership.role === OrgRole.OWNER) {
      throw new UnauthorizedError('Admins cannot remove owners');
    }

    // Prevent removing yourself
    if (userId === targetUserId) {
      throw new ValidationError('Cannot remove yourself from organization. Use exit organization instead.');
    }

    await this.organizationMemberRepository.remove(orgId, targetUserId);

    logger.info('Member removed', { orgId, userId, targetUserId });
  }

  async exitOrganization(orgId: string, userId: string): Promise<void> {
    if (!orgId || !userId) {
      throw new ValidationError('Organization ID and user ID are required');
    }

    // Check if user is a member
    const membership = await this.organizationMemberRepository.findByUserAndOrg(userId, orgId);
    if (!membership) {
      throw new UnauthorizedError('User is not a member of this organization');
    }

    // Prevent owners from exiting (they must transfer ownership first)
    if (membership.role === OrgRole.OWNER) {
      throw new UnauthorizedError('Owners cannot exit organization. Transfer ownership first.');
    }

    await this.organizationMemberRepository.remove(orgId, userId);

    logger.info('User exited organization', { orgId, userId });
  }
}
