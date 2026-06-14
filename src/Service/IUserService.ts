import type UserResponseDTO from '../DTO/UserResponse.dto';

export default interface IUserService {
  createUser(email: string, passwordHash: string): Promise<UserResponseDTO>;
  getUserByEmail(email: string): Promise<UserResponseDTO | null>;
  getUserById(id: string): Promise<UserResponseDTO | null>;
  emailExists(email: string): Promise<boolean>;
  getUserWithPasswordByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null>;
  updateUser(id: string, data: { name?: string }): Promise<UserResponseDTO>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
