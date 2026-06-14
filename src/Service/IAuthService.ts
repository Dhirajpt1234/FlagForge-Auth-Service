import type SignupRequestDTO from '../DTO/SignupRequest.dto';
import type LoginRequestDTO from '../DTO/LoginRequest.dto';
import type RefreshRequestDTO from '../DTO/RefreshRequest.dto';
import type AuthResponseDTO from '../DTO/AuthResponse.dto';
import type UserResponseDTO from '../DTO/UserResponse.dto';
import type SignupCompleteResponseDTO from '../DTO/SignupCompleteResponse.dto';
import type OrganizationResponseDTO from '../DTO/OrganizationResponse.dto';
import type OrganizationCreationDataDTO from '../DTO/OrganizationCreationData.dto';
import type ForgotPasswordResponseDTO from '../DTO/ForgotPasswordResponse.dto';

export default interface IAuthService {
  // Enhanced signup with organization creation
  signup(dto: SignupRequestDTO): Promise<SignupCompleteResponseDTO>;
  login(dto: LoginRequestDTO): Promise<AuthResponseDTO>;
  refreshToken(dto: RefreshRequestDTO): Promise<AuthResponseDTO>;
  logout(refreshToken: string): Promise<void>;
  getUserById(userId: string): Promise<UserResponseDTO | null>;
  
  // Password reset methods
  forgotPassword(email: string): Promise<ForgotPasswordResponseDTO>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  
  // Organization-related methods
  createOrganizationWithOwner(data: OrganizationCreationDataDTO, ownerId: string): Promise<OrganizationResponseDTO>;
  validateOrganizationSlug(slug: string, organizationId?: string): Promise<boolean>;
  generateOrganizationSlug(name: string): Promise<string>;
}
