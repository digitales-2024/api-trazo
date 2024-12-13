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
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZoningData } from '../interfaces';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { DeleteZoningDto } from './dto/delete-zoning.dto';

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

  @ApiOkResponse({ description: 'Get all zoning' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<ZoningData[]> {
    return this.zoningService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get zoning by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ZoningData> {
    return this.zoningService.findOne(id);
  }

  @ApiOkResponse({ description: 'Zoning successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateZoningDto: UpdateZoningDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ZoningData>> {
    return this.zoningService.update(id, updateZoningDto, user);
  }

  @ApiOkResponse({ description: 'Zoning deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() zoning: DeleteZoningDto,
    @GetUser() user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.zoningService.removeAll(zoning, user);
  }

  @ApiOkResponse({ description: 'Zoning reactivated' })
  @Patch('reactivate/all')
  reactivateAll(@GetUser() user: UserData, @Body() zoning: DeleteZoningDto) {
    return this.zoningService.reactivateAll(user, zoning);
  }
}
