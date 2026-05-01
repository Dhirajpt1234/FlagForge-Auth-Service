import type SignupRequestDTO from '../DTO/SignupRequest.dto';
import type LoginRequestDTO from '../DTO/LoginRequest.dto';
import type RefreshRequestDTO from '../DTO/RefreshRequest.dto';
import type AuthResponseDTO from '../DTO/AuthResponse.dto';
import type UserResponseDTO from '../DTO/UserResponse.dto';

export default interface IAuthService {
  signup(dto: SignupRequestDTO): Promise<AuthResponseDTO>;
  login(dto: LoginRequestDTO): Promise<AuthResponseDTO>;
  refreshToken(dto: RefreshRequestDTO): Promise<AuthResponseDTO>;
  logout(refreshToken: string): Promise<void>;
  getUserById(userId: string): Promise<UserResponseDTO | null>;
}
