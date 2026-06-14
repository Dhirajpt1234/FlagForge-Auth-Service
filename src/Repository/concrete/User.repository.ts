import type { default as IUserRepository } from '../IUser.repository';
import type { default as UserResponseDTO } from '../../DTO/UserResponse.dto';
import type { default as UserWithPasswordDTO } from '../../DTO/UserWithPassword.dto';
import DatabaseClient from '../../Database/db.client';
import { ConflictError, DatabaseError } from '../../Middleware/exceptionHandler.middleware';
import { PrismaClient } from '@prisma/client';

export default class UserRepository implements IUserRepository {
  private dbClient: PrismaClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getPrismaInstance().getPrismaClient();
  }

  async create(email: string, passwordHash: string, firstName?: string, lastName?: string): Promise<UserResponseDTO> {
    try {
      const existingUser = await this.dbClient.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const user = await this.dbClient.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
        },
      });

      return this.mapPrismaToUserResponse(user);
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      console.error('Error creating user:', error);
      throw new DatabaseError('Failed to create user');
    }
  }

  async findByEmail(email: string): Promise<UserResponseDTO | null> {
    try {
      const user = await this.dbClient.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      return this.mapPrismaToUserResponse(user);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  async findById(id: string): Promise<UserResponseDTO | null> {
    try {
      const user = await this.dbClient.user.findUnique({
        where: { id },
      });

      if (!user) {
        return null;
      }

      return this.mapPrismaToUserResponse(user);
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.dbClient.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new DatabaseError('Failed to check email');
    }
  }

  async findWithPasswordByEmail(email: string): Promise<UserWithPasswordDTO | null> {
    try {
      const user = await this.dbClient.user.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
      }) as UserWithPasswordDTO | null;

      return user;
    } catch (error) {
      console.error('Error getting user with password:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  async update(id: string, data: { firstName?: string; lastName?: string; avatarUrl?: string; phoneNumber?: string; timezone?: string; locale?: string; isActive?: boolean }): Promise<UserResponseDTO> {
    try {
      const user = await this.dbClient.user.update({
        where: { id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
          ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
          ...(data.timezone !== undefined && { timezone: data.timezone }),
          ...(data.locale !== undefined && { locale: data.locale }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
          updatedAt: new Date(),
        },
      });

      return this.mapPrismaToUserResponse(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new DatabaseError('Failed to update user');
    }
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      await this.dbClient.user.update({
        where: { id },
        data: {
          passwordHash,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating user password:', error);
      throw new DatabaseError('Failed to update user password');
    }
  }

  async updateLastLoginAt(id: string): Promise<void> {
    try {
      await this.dbClient.user.update({
        where: { id },
        data: {
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating last login time:', error);
      throw new DatabaseError('Failed to update last login time');
    }
  }

  private mapPrismaToUserResponse(user: any): UserResponseDTO {
    return {
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
    };
  }
}
