import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImportsService } from './imports.service';
import { ParseImportDto, PreviewImportDto, ExecuteImportDto } from './dto/imports.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('imports')
@UseGuards(JwtAuthGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('parse')
  async parseFile(@Body() dto: ParseImportDto) {
    return this.importsService.parseFileContent(dto);
  }

  @Post('preview')
  async previewImport(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: PreviewImportDto,
  ) {
    return this.importsService.previewImport(userId, workspaceId, dto);
  }

  @Post('execute')
  async executeImport(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Body() dto: ExecuteImportDto,
  ) {
    return this.importsService.executeImport(userId, workspaceId, dto);
  }
}
