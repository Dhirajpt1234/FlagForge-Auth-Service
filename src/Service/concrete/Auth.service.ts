import type IAuthService from '../IAuthService';
import type ITokenService from '../ITokenService';
import type IPasswordService from '../IPasswordService';
import type IUserService from '../IUserService';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../Middleware/exceptionHandler.middleware';
import IRefreshTokenRepository from '../../Repository/IRefreshToken.repository';
import SignupRequestDTO from '../../DTO/SignupRequest.dto';
import AuthResponseDTO from '../../DTO/AuthResponse.dto';
import LoginRequestDTO from '../../DTO/LoginRequest.dto';
import RefreshRequestDTO from '../../DTO/RefreshRequest.dto';
import UserResponseDTO from '../../DTO/UserResponse.dto';
import logger from '../../Utils/logger.util';

export default class AuthService implements IAuthService {
  private tokenService: ITokenService;
  private passwordService: IPasswordService;
  private userService: IUserService;
  private refreshTokenRepository: IRefreshTokenRepository;

  constructor(
    tokenService: ITokenService,
    passwordService: IPasswordService,
    userService: IUserService,
    refreshTokenRepository: IRefreshTokenRepository
  ) {
    this.tokenService = tokenService;
    this.passwordService = passwordService;
    this.userService = userService;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async signup(dto: SignupRequestDTO): Promise<AuthResponseDTO> {
    const { email, password } = dto;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    // TODO : Change the length to 6 later.
    if (password.length < 4) {
      throw new ValidationError('Password must be at least 4 characters long');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }

    const existingUser = await this.userService.emailExists(email);
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    const passwordHash = await this.passwordService.hash(password);
    const user = await this.userService.createUser(email, passwordHash);

    const accessToken = await this.tokenService.generateAccessToken(user.id);
    const refreshToken = await this.tokenService.generateRefreshToken();
    const refreshTokenHash = await this.tokenService.hashToken(refreshToken);
    const expiresAt = this.tokenService.getRefreshTokenExpiry();

    await this.refreshTokenRepository.create(user.id, refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken,
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

    const accessToken = await this.tokenService.generateAccessToken(user.id);
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

    const accessToken = await this.tokenService.generateAccessToken(user.id);
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
}
