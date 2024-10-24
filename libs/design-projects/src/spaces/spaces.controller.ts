import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { SpaceData } from '../interfaces/spaces.interfaces';

@ApiTags('Space')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'space', version: '1' })
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @ApiCreatedResponse({
    description: 'Space successfully created',
  })
  @Post()
  create(
    @Body() createSpaceDto: CreateSpaceDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SpaceData>> {
    return this.spacesService.create(createSpaceDto, user);
  }

  @Get()
  findAll() {
    return this.spacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spacesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
    return this.spacesService.update(+id, updateSpaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(+id);
  }
}
