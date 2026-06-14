import type IAuthService from '../IAuthService';
import type ITokenService from '../ITokenService';
import type IPasswordService from '../IPasswordService';
import type IUserService from '../IUserService';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../Middleware/exceptionHandler.middleware';
import IRefreshTokenRepository from '../../Repository/IRefreshToken.repository';
import IPasswordResetTokenRepository from '../../Repository/IPasswordResetToken.repository';
import IOrganizationRepository from '../../Repository/IOrganization.repository';
import IOrganizationMemberRepository from '../../Repository/IOrganizationMember.repository';
import SignupRequestDTO from '../../DTO/SignupRequest.dto';
import AuthResponseDTO from '../../DTO/AuthResponse.dto';
import SignupCompleteResponseDTO from '../../DTO/SignupCompleteResponse.dto';
import LoginRequestDTO from '../../DTO/LoginRequest.dto';
import RefreshRequestDTO from '../../DTO/RefreshRequest.dto';
import UserResponseDTO from '../../DTO/UserResponse.dto';
import OrganizationResponseDTO from '../../DTO/OrganizationResponse.dto';
import OrganizationCreationDataDTO from '../../DTO/OrganizationCreationData.dto';
import ForgotPasswordResponseDTO from '../../DTO/ForgotPasswordResponse.dto';
import logger from '../../Utils/logger.util';
import { OrgRole } from '../../Types/OrgRole.enum';
import { v4 as uuidv4 } from 'uuid';

export default class AuthService implements IAuthService {
  private tokenService: ITokenService;
  private passwordService: IPasswordService;
  private userService: IUserService;
  private refreshTokenRepository: IRefreshTokenRepository;
  private passwordResetTokenRepository: IPasswordResetTokenRepository;
  private organizationRepository: IOrganizationRepository;
  private organizationMemberRepository: IOrganizationMemberRepository;

  constructor(
    tokenService: ITokenService,
    passwordService: IPasswordService,
    userService: IUserService,
    refreshTokenRepository: IRefreshTokenRepository,
    passwordResetTokenRepository: IPasswordResetTokenRepository,
    organizationRepository: IOrganizationRepository,
    organizationMemberRepository: IOrganizationMemberRepository
  ) {
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.userService = userService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
    this.organizationRepository = organizationRepository;
    this.organizationMemberRepository = organizationMemberRepository;
  }

  async signup(dto: SignupRequestDTO): Promise<SignupCompleteResponseDTO> {
    const { email, password, firstName, lastName, organization } = dto;

    // Validation
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    if (!organization || !organization.name) {
      throw new ValidationError('Organization name is required');
    }

    // TODO : Change the length to 6 later.
    if (password.length < 4) {
      throw new ValidationError('Password must be at least 4 characters long');
    }

    if (organization.name.length < 3 || organization.name.length > 100) {
      throw new ValidationError('Organization name must be between 3 and 100 characters');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    const existingUser = await this.userService.emailExists(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Generate organization slug if not provided
    const slug = organization.slug || await this.generateOrganizationSlug(organization.name);
    
    // Check if slug already exists
    const slugExists = await this.organizationRepository.slugExists(slug);
    if (slugExists) {
      throw new ValidationError('Organization slug already exists');
    }

    // Create user, organization, and membership in a transaction-like flow
    const passwordHash = await this.passwordService.hash(password);
    const user = await this.userService.createUser(email, passwordHash, firstName, lastName);

    const orgData: OrganizationCreationDataDTO = {
      name: organization.name,
      slug: slug,
    };

    const createdOrganization = await this.createOrganizationWithOwner(orgData, user.id);

    // Create organization member with OWNER role
    await this.organizationMemberRepository.create({
      organizationId: createdOrganization.id,
      userId: user.id,
      role: OrgRole.OWNER,
    });

    // Generate tokens with organization context
    const accessToken = await this.tokenService.generateAccessTokenWithOrg(
      user.id,
      createdOrganization.id,
      OrgRole.OWNER
    );
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        phoneNumber: user.phoneNumber,
        timezone: user.timezone,
        locale: user.locale,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: createdOrganization,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(dto: LoginRequestDTO): Promise<AuthResponseDTO> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      logger. error('User not found');
      throw new ValidationError('Invalid email or password');
    }

    const userWithPassword = await this.userService.getUserWithPasswordByEmail(email);
    if (!userWithPassword) {
      logger. error('User not found');
      throw new ValidationError('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.compare(password, userWithPassword.passwordHash);
    if (!isPasswordValid) {
      logger. error('Invalid password');
      throw new ValidationError('Invalid email or password');
    }

    // Update last login time
    await this.userService.updateLastLoginAt(user.id);

    // Find user's organization membership
    const memberships = await this.organizationMemberRepository.findByUserId(user.id);
    
    if (!memberships || memberships.length === 0) {
      throw new UnauthorizedError('User is not a member of any organization');
    }

    // Use the first organization membership for login
    // TODO: In the future, let users choose which organization to log into
    const membership = memberships[0];
    
    const accessToken = await this.tokenService.generateAccessTokenWithOrg(
      user.id,
      membership.organizationId,
      membership.role as OrgRole
    );
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(dto: RefreshRequestDTO): Promise<AuthResponseDTO> {
    const { refreshToken } = dto;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const storedTokens = await this.refreshTokenRepository.findValidTokens();

    let validToken = null;
    for (const storedToken of storedTokens) {
      const isValid = await this.passwordService.compare(refreshToken, storedToken.tokenHash);
      if (isValid) {
        validToken = storedToken;
        break;
      }
    }

    if (!validToken) {
      throw new ValidationError('Invalid or expired refresh token');
    }

    const user = await this.userService.getUserById(validToken.userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    await this.refreshTokenRepository.deleteById(validToken.id);

    // Find user's organization membership
    const memberships = await this.organizationMemberRepository.findByUserId(user.id);
    
    if (!memberships || memberships.length === 0) {
      throw new UnauthorizedError('User is not a member of any organization');
    }

    // Use the first organization membership for token refresh
    // TODO: In the future, preserve the original organization context. so implement switch company feature.
    const membership = memberships[0];
    
    const accessToken = await this.tokenService.generateAccessTokenWithOrg(
      user.id,
      membership.organizationId,
      membership.role as OrgRole
    );
    const newRefreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(newRefreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const storedTokens = await this.refreshTokenRepository.findValidTokens();

    for (const storedToken of storedTokens) {
      const isValid = await this.passwordService.compare(refreshToken, storedToken.tokenHash);
      if (isValid) {
        await this.refreshTokenRepository.deleteById(storedToken.id);
        break;
      }
    }
  }

  async getUserById(userId: string): Promise<UserResponseDTO | null> {
    return await this.userService.getUserById(userId);
  }

  async createOrganizationWithOwner(data: OrganizationCreationDataDTO, ownerId: string): Promise<OrganizationResponseDTO> {
    return await this.organizationRepository.create({
      name: data.name,
      slug: data.slug,
      ownerId,
    });
  }

  async validateOrganizationSlug(slug: string, organizationId?: string): Promise<boolean> {
    return await this.organizationRepository.slugExists(slug, organizationId);
  }

  async generateOrganizationSlug(name: string): Promise<string> {
    // Convert to lowercase, replace spaces and special chars with hyphens
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure slug is not empty
    if (!slug) {
      slug = 'organization';
    }

    // Check if slug exists, if so append a number
    let finalSlug = slug;
    let counter = 1;
    
    while (await this.organizationRepository.slugExists(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    return finalSlug;
  }

  async forgotPassword(email: string): Promise<ForgotPasswordResponseDTO> {
    if (!email) {
      throw new ValidationError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    const user = await this.userService.getUserByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return {
        message: 'If an account with this email exists, a password reset link has been sent.',
      };
    }

    // Delete any existing reset tokens for this user
    await this.passwordResetTokenRepository.deleteByUserId(user.id);

    // Generate new reset token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await this.passwordResetTokenRepository.create(user.id, token, expiresAt);

    // TODO: Send email with reset link
    // For now, return the token in the response for development/testing
    logger.info(`Password reset token generated for user ${user.id}: ${token}`);

    return {
      message: 'If an account with this email exists, a password reset link has been sent.',
      expiresAt,
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || !newPassword) {
      throw new ValidationError('Token and new password are required');
    }

    if (newPassword.length < 4) {
      throw new ValidationError('Password must be at least 4 characters long');
    }

    // Find the reset token
    const resetToken = await this.passwordResetTokenRepository.findByToken(token);
    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new ValidationError('Reset token has expired');
    }

    // Check if token has already been used
    if (resetToken.used) {
      throw new ValidationError('Reset token has already been used');
    }

    // Get the user
    const user = await this.userService.getUserById(resetToken.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Hash the new password
    const passwordHash = await this.passwordService.hash(newPassword);

    // Update user's password
    await this.userService.updatePassword(resetToken.userId, passwordHash);

    // Mark the token as used
    await this.passwordResetTokenRepository.markAsUsed(resetToken.id);

    // Invalidate all refresh tokens for this user
    await this.refreshTokenRepository.deleteByUserId(resetToken.userId);

    logger.info(`Password reset successfully for user ${user.id}`);
  }
}
