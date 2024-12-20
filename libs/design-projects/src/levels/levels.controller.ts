import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { LevelsService } from './levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';

@ApiTags('Levels')
@Controller({ path: 'levels', version: '1' })
@Auth()
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @ApiCreatedResponse({ description: 'Creates a level' })
  @ApiBadRequestResponse({
    description: 'Validation error or quotation is approved',
  })
  @Post()
  create(@Body() createLevelDto: CreateLevelDto, @GetUser() user: UserData) {
    return this.levelsService.create(createLevelDto, user);
  }

  @ApiOkResponse({
    description: 'Get all levels that belong to the passed *quotation* id',
  })
  @ApiNotFoundResponse({ description: 'id does not belong to a quotation' })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserData) {
    return this.levelsService.findOne(id, user);
  }

  @ApiOkResponse({ description: 'Edit a level info' })
  @ApiNotFoundResponse({ description: 'Level not found' })
  @ApiBadRequestResponse({
    description: 'The corresponding quotation is not editable',
  })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateLevelDto: UpdateLevelDto,
    @GetUser() user: UserData,
  ) {
    return this.levelsService.update(id, updateLevelDto, user);
  }

  @ApiOkResponse({
    description: 'Completely delete a level, and all its spaces',
  })
  @ApiNotFoundResponse({ description: 'Level not found' })
  @ApiBadRequestResponse({
    description: 'The corresponding quotation is not editable',
  })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserData) {
    return this.levelsService.remove(id, user);
  }
}
