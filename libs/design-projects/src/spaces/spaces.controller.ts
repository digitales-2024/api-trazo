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
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { SpaceData } from '../interfaces';

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

  @ApiOkResponse({ description: 'Get all spaces' })
  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.spacesService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get space by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<SpaceData> {
    return this.spacesService.findOne(id);
  }

  @ApiOkResponse({ description: 'Space successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SpaceData>> {
    return this.spacesService.update(id, updateSpaceDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spacesService.remove(+id);
  }
}
