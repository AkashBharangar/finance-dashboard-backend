import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { validateEntityId } from 'src/common/utils/id-validation.util';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

export interface PersistedUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SafeUser = Omit<PersistedUser, 'passwordHash' | 'role'> & {
  role: Role;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        isActive: createUserDto.isActive ?? true,
        passwordHash,
      },
    });

    return this.stripPassword(user);
  }

  async getUsers(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user: PersistedUser) => this.stripPassword(user));
  }

  async updateRole(id: string, role: Role): Promise<SafeUser> {
    validateEntityId(id, 'user');
    await this.ensureUserExists(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
    });

    return this.stripPassword(updatedUser);
  }

  async updateStatus(id: string, isActive: boolean): Promise<SafeUser> {
    validateEntityId(id, 'user');
    await this.ensureUserExists(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
    });

    return this.stripPassword(updatedUser);
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    validateEntityId(id, 'user');
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private stripPassword(user: PersistedUser): SafeUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      role: safeUser.role as Role,
    };
  }
}
