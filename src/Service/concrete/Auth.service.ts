import type IAuthService from '../IAuthService';
import type ITokenService from '../ITokenService';
import type IPasswordService from '../IPasswordService';
import type IUserService from '../IUserService';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../Middleware/exceptionHandler.middleware';
import IRefreshTokenRepository from '../../Repository/IRefreshToken.repository';
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
import logger from '../../Utils/logger.util';
import { OrgRole } from '../../Types/OrgRole.enum';

export default class AuthService implements IAuthService {
  private tokenService: ITokenService;
  private passwordService: IPasswordService;
  private userService: IUserService;
  private refreshTokenRepository: IRefreshTokenRepository;
  private organizationRepository: IOrganizationRepository;
  private organizationMemberRepository: IOrganizationMemberRepository;

  constructor(
    tokenService: ITokenService,
    passwordService: IPasswordService,
    userService: IUserService,
    refreshTokenRepository: IRefreshTokenRepository,
    organizationRepository: IOrganizationRepository,
    organizationMemberRepository: IOrganizationMemberRepository
  ) {
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.userService = userService;
    this.refreshTokenRepository = refreshTokenRepository;
    this.organizationRepository = organizationRepository;
    this.organizationMemberRepository = organizationMemberRepository;
  }

  async signup(dto: SignupRequestDTO): Promise<SignupCompleteResponseDTO> {
    const { email, password, name, organization } = dto;

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
    const user = await this.userService.createUser(email, passwordHash);

    const orgData: OrganizationCreationDataDTO = {
      name: organization.name,
      slug: slug,
      ownerId: user.id,
    };

    const createdOrganization = await this.createOrganizationWithOwner(orgData);

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

  async createOrganizationWithOwner(data: OrganizationCreationDataDTO): Promise<OrganizationResponseDTO> {
    return await this.organizationRepository.create(data);
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
}
