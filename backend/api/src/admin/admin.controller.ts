import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto, AuditLogQueryDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get user list for admin management' })
  @ApiResponse({ status: 200, description: 'List of platform users and entity counts' })
  async getUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getUsers(search, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: 'Update user active/locked status' })
  @ApiResponse({ status: 200, description: 'User status updated' })
  async updateUserStatus(
    @CurrentUser() user: AuthUserContext,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Get system & banking integration provider health metrics' })
  @ApiResponse({ status: 200, description: 'Provider status, queue state, and DB latencies' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('ai-metrics')
  @ApiOperation({ summary: 'Get AI token usage & cost analytics' })
  @ApiResponse({ status: 200, description: 'AI token consumption and estimated API costs' })
  async getAiMetrics() {
    return this.adminService.getAiMetrics();
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get platform system audit logs' })
  @ApiResponse({ status: 200, description: 'Paginated audit trail log entries' })
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    return this.adminService.getAuditLogs(query);
  }
}
