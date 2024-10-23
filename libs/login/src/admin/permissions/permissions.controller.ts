import { Controller, Get, Param } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { Auth } from '../auth/decorators';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';

@ApiTags('Permissions')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Auth()
@Controller({
  path: 'permissions',
  version: '1'
})
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOkResponse({ description: 'Return all permissions' })
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOkResponse({ description: 'Return a permission' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }
}
