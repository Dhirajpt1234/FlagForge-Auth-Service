import type IInvitationService from '../IInvitationService';
import type IInvitationRepository from '../../Repository/IInvitation.repository';
import type IOrganizationRepository from '../../Repository/IOrganization.repository';
import type IOrganizationMemberRepository from '../../Repository/IOrganizationMember.repository';
import type IUserService from '../IUserService';
import type IPasswordService from '../IPasswordService';
import type ITokenService from '../ITokenService';
import type IEmailService from '../IEmailService';
import type IRefreshTokenRepository from '../../Repository/IRefreshToken.repository';
import type CreateInvitationRequestDTO from '../../DTO/InvitationRequest.dto';
import type { InvitationResponseDTO, AcceptInvitationRequestDTO, InvitationListResponseDTO } from '../../DTO/InvitationRequest.dto';
import type AuthResponseDTO from '../../DTO/AuthResponse.dto';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../Middleware/exceptionHandler.middleware';
import { Invitation, InvitationStatus } from '@prisma/client';
import { OrgRole } from '../../Types/OrgRole.enum';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../Utils/logger.util';
import { InvitationEmailParams } from '../IEmailService';

export default class InvitationService implements IInvitationService {
  private invitationRepository: IInvitationRepository;
  private organizationRepository: IOrganizationRepository;
  private organizationMemberRepository: IOrganizationMemberRepository;
  private userService: IUserService;
  private passwordService: IPasswordService;
  private tokenService: ITokenService;
  private emailService: IEmailService;
  private refreshTokenRepository: IRefreshTokenRepository;

  constructor(
    invitationRepository: IInvitationRepository,
    organizationRepository: IOrganizationRepository,
    organizationMemberRepository: IOrganizationMemberRepository,
    userService: IUserService,
    passwordService: IPasswordService,
    tokenService: ITokenService,
    emailService: IEmailService,
    refreshTokenRepository: IRefreshTokenRepository
  ) {
    this.invitationRepository = invitationRepository;
    this.organizationRepository = organizationRepository;
    this.organizationMemberRepository = organizationMemberRepository;
    this.userService = userService;
    this.passwordService = passwordService;
    this.tokenService = tokenService;
    this.emailService = emailService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async createInvitation(orgId: string, invitedById: string, data: CreateInvitationRequestDTO): Promise<InvitationResponseDTO> {
    const { email, role } = data;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check if user is already a member of the organization
    const existingMember = await this.organizationMemberRepository.findByUserAndOrg(email, orgId);
    if (existingMember) {
      throw new ValidationError('User is already a member of this organization');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.invitationRepository.findByOrgAndEmail(orgId, email);
    if (existingInvitation && existingInvitation.status === InvitationStatus.PENDING) {
      throw new ValidationError('Invitation already sent to this email');
    }

    // Create new invitation
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 15); // 15 days expiry

    const invitation = await this.invitationRepository.create({
      organizationId: orgId,
      email,
      role,
      token,
      invitedById,
      expiresAt,
    });

    // Get organization details
    const organization = await this.organizationRepository.findById(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Get inviter details for email
    const inviter = await this.userService.getUserById(invitedById);
    if (!inviter) {
      throw new NotFoundError('Inviter not found');
    }

    // Send invitation email
    try {
      const inviterName = `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim() || inviter.email;
      await this.emailService.sendInvitationEmail({
        to: email,
        organizationName: organization.name,
        inviterName,
        role,
        acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`,
        expiryDays: 15,
        subject: '', // Email service will generate this
        htmlBody: '', // Email service will generate this
        textBody: '', // Email service will generate this
      });
    } catch (error) {
      logger.error('Failed to send invitation email:', error);
      // Continue even if email fails
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as OrgRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      token: invitation.token,
      invitedBy: {
        id: invitation.invitedById,
        email: inviter.email,
        firstName: inviter.firstName || null,
        lastName: inviter.lastName || null,
      },
      organization: {
        id: invitation.organizationId,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }

  async acceptInvitation(token: string, userData: AcceptInvitationRequestDTO): Promise<AuthResponseDTO> {
    const { name, password } = userData;

    // Find invitation by token
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundError('Invalid invitation token');
    }

    // Check if invitation is expired
    if (new Date() > invitation.expiresAt) {
      await this.invitationRepository.updateStatus(invitation.id, InvitationStatus.EXPIRED);
      throw new ValidationError('Invitation has expired');
    }

    // Check if invitation is already accepted
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ValidationError('Invitation has already been accepted');
    }

    // Validate password
    if (password.length < 4) {
      throw new ValidationError('Password must be at least 4 characters long');
    }

    // Check if user already exists
    let user = await this.userService.getUserByEmail(invitation.email);
    
    if (!user) {
      // Create new user
      const passwordHash = await this.passwordService.hash(password);
      user = await this.userService.createUser(invitation.email, passwordHash);
    } else {
      // Validate existing user's password
      const userWithPassword = await this.userService.getUserWithPasswordByEmail(invitation.email);
      if (!userWithPassword) {
        throw new NotFoundError('User not found');
      }

      const isPasswordValid = await this.passwordService.compare(password, userWithPassword.passwordHash);
      if (!isPasswordValid) {
        throw new ValidationError('Invalid password');
      }
    }

    // Update user name if not set
    if ((!user.firstName || !user.lastName) && name) {
      const nameParts = name.split(' ');
      await this.userService.updateUser(user.id, {
        firstName: nameParts[0] || user.firstName,
        lastName: nameParts.slice(1).join(' ') || user.lastName,
      });
    }

    // Add user to organization
    await this.organizationMemberRepository.create({
      organizationId: invitation.organizationId,
      userId: user.id,
      role: invitation.role as OrgRole,
    });

    // Update invitation status
    await this.invitationRepository.updateStatus(invitation.id, InvitationStatus.ACCEPTED);

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessTokenWithOrg(
      user.id,
      invitation.organizationId,
      invitation.role as OrgRole
    );
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    // Get organization details for email notifications
    const organization = await this.organizationRepository.findById(invitation.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Send member notification emails to existing members
    try {
      const existingMembers = await this.organizationMemberRepository.findByOrgId(invitation.organizationId);
      for (const member of existingMembers) {
        if (member.userId !== user.id) { // Don't notify the new user
          const memberUser = await this.userService.getUserById(member.userId);
          if (memberUser) {
            await this.emailService.sendMemberNotificationEmail({
              to: memberUser.email,
              organizationName: organization.name,
              newMemberName: name || user.email,
              newMemberEmail: user.email,
              newMemberRole: invitation.role,
              subject: '', // Email service will generate this
              htmlBody: '', // Email service will generate this
              textBody: '', // Email service will generate this
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to send member notification emails:', error);
      // Continue even if notifications fail
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async listInvitations(orgId: string, status?: string): Promise<InvitationListResponseDTO> {
    const invitations = await this.invitationRepository.findByOrganization(orgId, status);

    // Get organization details
    const organization = await this.organizationRepository.findById(orgId);

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      invitations: invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role as OrgRole,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        token: invitation.token,
        invitedBy: {
          id: invitation.invitedById,
          email: invitation.invitedBy.email,
          firstName: invitation.invitedBy.firstName,
          lastName: invitation.invitedBy.lastName,
        },
        organization: {
          id: invitation.organizationId,
          name: organization.name,
          slug: organization.slug,
        },
      })),
      total: invitations.length,
    };
  }

  async revokeInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.invitationRepository.findByInvitationId(invitationId);
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ValidationError('Can only revoke pending invitations');
    }

    await this.invitationRepository.updateStatus(invitationId, InvitationStatus.REVOKED);
  }

  async resendInvitation(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.invitationRepository.findByInvitationId(invitationId);
    if (!invitation) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new ValidationError('Can only resend pending invitations');
    }

    // Get organization details
    const organization = await this.organizationRepository.findById(invitation.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Check if expired, if so, create new invitation
    if (new Date() > invitation.expiresAt) {
      await this.invitationRepository.updateStatus(invitationId, InvitationStatus.EXPIRED);
      
      // Create new invitation with same details
      const newToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 15);

      const newInvitation = await this.invitationRepository.create({
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
        token: newToken,
        invitedById: invitation.invitedById,
        expiresAt,
      });

      // Send new invitation email
      const inviter = await this.userService.getUserById(invitation.invitedById);
      if (inviter) {
        await this.emailService.sendInvitationEmail({
          to: invitation.email,
          organizationName: organization.name,
          inviterName: `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || inviter.email,
          role: invitation.role,
          acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${newToken}`,
          expiryDays: 15,
          subject: '', // Email service will generate this
          htmlBody: '', // Email service will generate this
          textBody: '', // Email service will generate this
        });
      }
    } else {
      // Resend existing invitation
      const inviter = await this.userService.getUserById(invitation.invitedById);
      if (inviter) {
        await this.emailService.sendInvitationEmail({
          to: invitation.email,
          organizationName: organization.name,
          inviterName: `${inviter.firstName || ""} ${inviter.lastName || ""}`.trim() || inviter.email,
          role: invitation.role,
          acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invitation.token}`,
          expiryDays: 15,
          subject: '', // Email service will generate this
          htmlBody: '', // Email service will generate this
          textBody: '', // Email service will generate this
        });
      }
    }
  }

  async getInvitationByInvitationId(invitationId: string): Promise<InvitationResponseDTO | null> {
    const invitation = await this.invitationRepository.findByInvitationId(invitationId);
    if (!invitation) {
      return null;
    }

    // Get organization details
    const organization = await this.organizationRepository.findById(invitation.organizationId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as OrgRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      token: invitation.token,
      invitedBy: {
        id: invitation.invitedById,
        email: invitation.invitedBy.email,
        firstName: invitation.invitedBy.firstName || null,
        lastName: invitation.invitedBy.lastName || null,
      },
      organization: {
        id: invitation.organizationId,
        name: organization.name,
        slug: organization.slug,
      },
    };
  }

  async getInvitationByToken(token: string): Promise<InvitationResponseDTO | null> {
    const invitation = await this.invitationRepository.findByToken(token);
    if (!invitation) {
      return null;
    }

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role as OrgRole,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      token: invitation.token,
      invitedBy: {
        id: invitation.invitedById,
        email: invitation.invitedBy.email,
        firstName: invitation.invitedBy.firstName || null,
        lastName: invitation.invitedBy.lastName || null,
      },
      organization: {
        id: invitation.organizationId,
        name: invitation.organization.name,
        slug: invitation.organization.slug,
      },
    };
  }
}
