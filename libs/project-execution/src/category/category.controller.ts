import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { CategoryData } from '../interfaces';
import { DeleteCategoriesDto } from './dto/delete-category.dto';

@ApiTags('Category')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'category', version: '1' })
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiCreatedResponse({
    description: 'Category successfully created',
  })
  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<CategoryData>> {
    return this.categoryService.create(createCategoryDto, user);
  }

  @ApiOkResponse({ description: 'Get all categories' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<CategoryData[]> {
    return this.categoryService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get category by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<CategoryData> {
    return this.categoryService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get full data of category' })
  @Get('full/category')
  findAllCategoryData(@GetUser() user: UserPayload): Promise<CategoryData[]> {
    return this.categoryService.findAllCategoryData(user);
  }

  @ApiOkResponse({ description: 'Category successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @GetUser() user: UserData,
  ) {
    return this.categoryService.update(id, updateCategoryDto, user);
  }

  @ApiOkResponse({ description: 'Categories deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() categories: DeleteCategoriesDto,
    @GetUser() user: UserPayload,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.categoryService.removeAll(categories, user);
  }

  @ApiOkResponse({ description: 'Categories reactivated' })
  @Patch('reactivate/all')
  reactivateAll(
    @GetUser() user: UserData,
    @Body() categories: DeleteCategoriesDto,
  ) {
    return this.categoryService.reactivateAll(user, categories);
  }
}
