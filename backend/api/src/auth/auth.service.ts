import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('A user with this email address already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        phone: dto.phone,
        currency: dto.currency || 'NGN',
        country: dto.country || 'Nigeria',
      },
    });

    // Create default Personal Workspace for user
    const workspace = await this.prisma.workspace.create({
      data: {
        name: `${user.name}'s Personal Workspace`,
        type: 'PERSONAL',
        currency: user.currency,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.name, workspace.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        country: user.country,
        createdAt: user.createdAt,
      },
      defaultWorkspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email address or password');
    }

    const defaultWorkspaceId = user.memberships[0]?.workspaceId;

    const tokens = await this.generateTokens(user.id, user.email, user.name, defaultWorkspaceId, dto.deviceInfo);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        country: user.country,
        createdAt: user.createdAt,
      },
      defaultWorkspaceId,
      ...tokens,
    };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session || !session.isValid || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = session.user;
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId: user.id },
    });

    // Invalidate old session token
    await this.prisma.session.update({
      where: { id: session.id },
      data: { isValid: false },
    });

    const newTokens = await this.generateTokens(user.id, user.email, user.name, membership?.workspaceId, session.deviceInfo);

    return newTokens;
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: { userId, refreshToken },
        data: { isValid: false },
      });
    } else {
      await this.prisma.session.updateMany({
        where: { userId },
        data: { isValid: false },
      });
    }

    return { message: 'Successfully logged out' };
  }

  private async generateTokens(userId: string, email: string, name: string, workspaceId?: string, deviceInfo?: string) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'super-secret-jwt-key';

    const payload = { sub: userId, email, name, workspaceId };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtSecret,
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      { secret: jwtSecret, expiresIn: '7d' },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        deviceInfo: deviceInfo || 'Unknown Device',
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
}
