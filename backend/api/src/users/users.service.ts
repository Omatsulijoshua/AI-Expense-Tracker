import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  avatar?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        currency: true,
        timezone: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        currency: true,
        timezone: true,
        avatar: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, isValid: true },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isValid: false },
    });

    return { message: 'Session revoked successfully' };
  }
}
