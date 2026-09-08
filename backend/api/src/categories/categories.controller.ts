import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthUserContext } from '../auth/current-user.decorator';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all default and user custom categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories(@CurrentUser() user: AuthUserContext) {
    return this.categoriesService.getCategories(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(@CurrentUser() user: AuthUserContext, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(user.id, dto);
  }
}
