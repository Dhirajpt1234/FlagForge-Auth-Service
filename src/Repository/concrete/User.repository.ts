import type { default as IUserRepository } from '../IUser.repository';
import type UserResponseDTO from '../../DTO/UserResponse.dto';
import DatabaseClient from '../../Database/db.client';
import { ConflictError, NotFoundError, DatabaseError } from '../../Middleware/exceptionHandler.middleware';

export default class UserRepository implements IUserRepository {
  private dbClient: DatabaseClient;

  constructor(databaseUrl: string) {
    this.dbClient = DatabaseClient.getInstance();
  }

  async create(email: string, passwordHash: string): Promise<UserResponseDTO> {
    try {
      const db = DatabaseClient.getPrismaInstance();
      const dbClient = db.getPrismaClient();

      const existingUser = await dbClient.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      const user = await dbClient.user.create({
        data: {
          email,
          passwordHash,
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
      const db = DatabaseClient.getPrismaInstance();
      const dbClient = db.getPrismaClient();

      const user = await dbClient.user.findUnique({
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
      const db = DatabaseClient.getPrismaInstance();
      const dbClient = db.getPrismaClient();

      const user = await dbClient.user.findUnique({
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
      const db = DatabaseClient.getPrismaInstance();
      const dbClient = db.getPrismaClient();

      const user = await dbClient.user.findUnique({
        where: { email },
        select: { id: true },
      });

      return !!user;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw new DatabaseError('Failed to check email');
    }
  }

  async findWithPasswordByEmail(email: string): Promise<{ id: string; email: string; passwordHash: string } | null> {
    try {
      const db = DatabaseClient.getPrismaInstance();
      const dbClient = db.getPrismaClient();

      const user = await dbClient.user.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true },
      });

      return user;
    } catch (error) {
      console.error('Error getting user with password:', error);
      throw new DatabaseError('Failed to get user');
    }
  }

  private mapPrismaToUserResponse(user: any): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
