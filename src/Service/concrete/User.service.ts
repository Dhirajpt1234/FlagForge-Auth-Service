import type IUserService from '../IUserService';
import type UserResponseDTO from '../../DTO/UserResponse.dto';
import IUserRepository from '../../Repository/IUser.repository';

export default class UserService implements IUserService {
  private userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async createUser(email: string, passwordHash: string, firstName?: string, lastName?: string): Promise<UserResponseDTO> {
    return await this.userRepository.create(email, passwordHash, firstName, lastName);
  }

  async getUserByEmail(email: string): Promise<UserResponseDTO | null> {
    return await this.userRepository.findByEmail(email);
  }

  async getUserById(id: string): Promise<UserResponseDTO | null> {
    return await this.userRepository.findById(id);
  }

  async emailExists(email: string): Promise<boolean> {
    return await this.userRepository.emailExists(email);
  }

  async getUserWithPasswordByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null> {
    const userRepo = this.userRepository as any;
    if (userRepo.findWithPasswordByEmail) {
      return await userRepo.findWithPasswordByEmail(email);
    }
    throw new Error('Method not implemented');
  }

  async updateUser(id: string, data: { firstName?: string; lastName?: string; avatarUrl?: string; phoneNumber?: string; timezone?: string; locale?: string; isActive?: boolean }): Promise<UserResponseDTO> {
    return await this.userRepository.update(id, data);
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.userRepository.updatePassword(id, passwordHash);
  }

  async updateLastLoginAt(id: string): Promise<void> {
    await this.userRepository.updateLastLoginAt(id);
  }
}
