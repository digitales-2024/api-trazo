import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';

@ApiTags('Business')
@ApiInternalServerErrorResponse({
  description: 'Internal server error',
})
@Controller({ path: 'business', version: '1' })
@Auth()
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @ApiCreatedResponse({ description: 'Business created' })
  @ApiConflictResponse({ description: 'A business already exists' })
  @Post()
  create(
    @Body() createBusinessDto: CreateBusinessDto,
    @GetUser() user: UserData,
  ) {
    return this.businessService.create(createBusinessDto, user);
  }

  @ApiOkResponse({ description: 'Returns an array with a single business' })
  @ApiInternalServerErrorResponse({
    description: 'There is more than one business registered',
  })
  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @GetUser() user: UserData,
  ) {
    return this.businessService.update(id, updateBusinessDto, user);
  }
}
