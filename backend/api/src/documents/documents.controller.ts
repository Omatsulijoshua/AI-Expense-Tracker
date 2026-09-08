import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto, ConfirmReceiptTransactionDto } from './dto/documents.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  async uploadDocument(
    @CurrentUser('id') userId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(userId, dto);
  }

  @Post(':id/analyze')
  async analyzeReceipt(
    @CurrentUser('id') userId: string,
    @Param('id') documentId: string,
  ) {
    return this.documentsService.analyzeReceipt(userId, documentId);
  }

  @Get()
  async getDocuments(@CurrentUser('id') userId: string) {
    return this.documentsService.getDocuments(userId);
  }

  @Get(':id')
  async getDocumentById(
    @CurrentUser('id') userId: string,
    @Param('id') documentId: string,
  ) {
    return this.documentsService.getDocumentById(userId, documentId);
  }

  @Post(':id/confirm')
  async confirmReceiptTransaction(
    @CurrentUser('id') userId: string,
    @CurrentUser('workspaceId') workspaceId: string,
    @Param('id') documentId: string,
    @Body() dto: ConfirmReceiptTransactionDto,
  ) {
    return this.documentsService.confirmReceiptTransaction(userId, workspaceId, documentId, dto);
  }

  @Delete(':id')
  async deleteDocument(
    @CurrentUser('id') userId: string,
    @Param('id') documentId: string,
  ) {
    return this.documentsService.deleteDocument(userId, documentId);
  }
}
