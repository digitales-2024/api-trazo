import { Controller, Get, Param } from '@nestjs/common';
import { ModulesService } from './modules.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators';

@ApiTags('Modules')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'modules',
  version: '1'
})
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @ApiOkResponse({ description: 'Return all modules' })
  @Get()
  findAll() {
    return this.modulesService.findAll();
  }

  @ApiOkResponse({ description: 'Return a module' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }
}
