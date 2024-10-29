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

  @Get()
  findAll() {
    return this.levelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.levelsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelsService.update(+id, updateLevelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.levelsService.remove(+id);
  }
}
