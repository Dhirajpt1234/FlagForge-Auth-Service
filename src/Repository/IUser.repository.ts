import type UserResponseDTO from '../DTO/UserResponse.dto';

export default interface IUserRepository {
  create(email: string, passwordHash: string): Promise<UserResponseDTO>;
  findByEmail(email: string): Promise<UserResponseDTO | null>;
  findById(id: string): Promise<UserResponseDTO | null>;
  emailExists(email: string): Promise<boolean>;
  findWithPasswordByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null>;
}
