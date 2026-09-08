import { Controller, Get, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService, UpdateProfileDto } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile details returned' })
  async getProfile(@CurrentUser() user: AuthUserContext) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile preferences' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@CurrentUser() user: AuthUserContext, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List active user sessions/devices' })
  @ApiResponse({ status: 200, description: 'List of active sessions' })
  async getSessions(@CurrentUser() user: AuthUserContext) {
    return this.usersService.getSessions(user.id);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke specific device session' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(@CurrentUser() user: AuthUserContext, @Param('id') sessionId: string) {
    return this.usersService.revokeSession(user.id, sessionId);
  }
}
