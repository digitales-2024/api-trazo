import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RolService } from './rol.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { Auth, GetUser } from '../auth/decorators';
import { UpdateRolDto } from './dto/update-rol.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, Rol, RolModulesPermissions, RolPermissions, UserData } from '@login/login/interfaces';
import { DeleteRolesDto } from './dto/delete-roles.dto';

@ApiTags('Rol')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@Controller({ path: 'rol', version: '1' })
@Auth()
export class RolController {
  constructor(private readonly rolService: RolService) {}

  @ApiCreatedResponse({ description: 'Rol created' })
  @ApiBadRequestResponse({ description: 'Rol already exists and schema errors' })
  @ApiBody({ type: CreateRolDto })
  @Post()
  create(@Body() createRolDto: CreateRolDto): Promise<HttpResponse<Rol>> {
    return this.rolService.create(createRolDto);
  }

  @ApiOkResponse({ description: 'Rol updated' })
  @ApiBadRequestResponse({ description: 'No data to update' })
  @ApiBody({ type: UpdateRolDto })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRolDto: UpdateRolDto
  ): Promise<HttpResponse<RolPermissions>> {
    return this.rolService.update(id, updateRolDto);
  }

  @ApiBadRequestResponse({ description: 'Rol no found' })
  @ApiOkResponse({ description: 'Rol deleted' })
  @Delete(':id')
  remove(@Param('id') id: string): Promise<HttpResponse<Rol>> {
    return this.rolService.remove(id);
  }

  @ApiBadRequestResponse({ description: 'Rols no found' })
  @ApiOkResponse({ description: 'Rols deleted' })
  @Delete('remove/all')
  removeAll(
    @Body() roles: DeleteRolesDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.rolService.removeAll(roles, user);
  }

  @ApiBadRequestResponse({ description: 'Rols no found' })
  @ApiOkResponse({ description: 'Rols reactivated' })
  @Patch('reactivate/all')
  reactivateAll(
    @Body() roles: DeleteRolesDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.rolService.reactivateAll(roles, user);
  }

  @ApiBadRequestResponse({ description: 'Rols no found' })
  @ApiOkResponse({ description: 'Rols found' })
  @Get()
  findAll(@GetUser() user: UserData): Promise<RolPermissions[]> {
    return this.rolService.findAll(user);
  }

  @ApiBadRequestResponse({ description: 'Rol no found' })
  @ApiOkResponse({ description: 'Rol found' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<RolPermissions> {
    return this.rolService.findById(id);
  }

  @Get('modules-permissions/all')
  findAllModulesPermissions(): Promise<RolModulesPermissions[]> {
    return this.rolService.findAllModulesPermissions();
  }
}
