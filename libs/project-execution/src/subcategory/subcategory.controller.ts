import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SubcategoryData } from '../interfaces';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { DeleteSubcategoriesDto } from './dto/delete-subcategory.dto';

@ApiTags('Subcategory')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'subcategory', version: '1' })
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @ApiCreatedResponse({ description: 'Subcategory successfully created' })
  @Post()
  create(
    @Body() createSubcategoryDto: CreateSubcategoryDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SubcategoryData>> {
    return this.subcategoryService.create(createSubcategoryDto, user);
  }

  @ApiOkResponse({ description: 'Get all subcategories' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<SubcategoryData[]> {
    return this.subcategoryService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get all subcategories from category' })
  @Get('category/:id')
  getAllSubcategoriesFromCategory(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ): Promise<SubcategoryData[]> {
    return this.subcategoryService.getAllSubcategoriesFromCategory(id, user);
  }

  @ApiOkResponse({ description: 'Get subcategory by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<SubcategoryData> {
    return this.subcategoryService.findOne(id);
  }

  @ApiOkResponse({ description: 'Subcategory successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
    @GetUser() user: UserData,
  ) {
    return this.subcategoryService.update(id, updateSubcategoryDto, user);
  }

  @ApiOkResponse({ description: 'Subcategory deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() subcategories: DeleteSubcategoriesDto,
    @GetUser() user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.subcategoryService.removeAll(subcategories, user);
  }

  @ApiOkResponse({ description: 'Subcategory reactivated' })
  @Patch('reactivate/all')
  reactivateAll(
    @GetUser() user: UserData,
    @Body() subcategories: DeleteSubcategoriesDto,
  ) {
    return this.subcategoryService.reactivateAll(user, subcategories);
  }
}
