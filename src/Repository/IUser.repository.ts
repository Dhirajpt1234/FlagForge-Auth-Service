import type UserResponseDTO from '../DTO/UserResponse.dto';

export default interface IUserRepository {
  create(email: string, passwordHash: string, firstName?: string, lastName?: string): Promise<UserResponseDTO>;
  findByEmail(email: string): Promise<UserResponseDTO | null>;
  findById(id: string): Promise<UserResponseDTO | null>;
  emailExists(email: string): Promise<boolean>;
  findWithPasswordByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null>;
  update(id: string, data: { firstName?: string; lastName?: string; avatarUrl?: string; phoneNumber?: string; timezone?: string; locale?: string; isActive?: boolean }): Promise<UserResponseDTO>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  updateLastLoginAt(id: string): Promise<void>;
}
