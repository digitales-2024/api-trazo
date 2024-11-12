import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ZoningService } from './zoning.service';
import { CreateZoningDto } from './dto/create-zoning.dto';
import { UpdateZoningDto } from './dto/update-zoning.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZoningData } from '../interfaces';
import { HttpResponse, UserData } from '@login/login/interfaces';

@ApiTags('Zoning')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'zoning', version: '1' })
export class ZoningController {
  constructor(private readonly zoningService: ZoningService) {}

  @ApiCreatedResponse({
    description: 'Zoning successfully created',
  })
  @Post()
  create(
    @Body() createZoningDto: CreateZoningDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ZoningData>> {
    return this.zoningService.create(createZoningDto, user);
  }

  @Get()
  findAll() {
    return this.zoningService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zoningService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateZoningDto: UpdateZoningDto) {
    return this.zoningService.update(id, updateZoningDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zoningService.remove(id);
  }
}
