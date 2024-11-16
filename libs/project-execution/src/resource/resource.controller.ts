import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Patch,
  Param,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { ResourceData } from '../interfaces';
import { ResourceType } from '@prisma/client';
import { DeleteResourcesDto } from './dto/delete-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@ApiTags('Resources')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'resources', version: '1' })
@Auth()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new resource',
    description: 'Creates a new resource with the provided data',
  })
  @ApiCreatedResponse({
    description: 'Resource created successfully',
    type: CreateResourceDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or resource name already exists',
  })
  create(
    @Body() createResourceDto: CreateResourceDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ResourceData>> {
    return this.resourceService.create(createResourceDto, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing resource',
    description: 'Updates the specified resource with the provided data',
  })
  @ApiOkResponse({
    description: 'Resource updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or resource name already exists',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ResourceData>> {
    return this.resourceService.update(id, updateResourceDto, user);
  }

  @Patch('reactivate/all')
  @ApiOperation({
    summary: 'Reactive all resources',
    description: 'Reactive all resources',
  })
  @ApiOkResponse({
    description: 'Resources reactivated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or resources not found',
  })
  reactivateAll(
    @GetUser() user: UserData,
    @Body() deleteResourcesDto: DeleteResourcesDto,
  ) {
    return this.resourceService.reactivateAll(user, deleteResourcesDto);
  }
  @Get(':id')
  @ApiOperation({
    summary: 'Get a resource by ID',
    description: 'Returns the resource with the specified ID',
  })
  @ApiOkResponse({
    description: 'Resource found successfully',
  })
  @ApiNotFoundResponse({
    description: 'Resource not found',
  })
  findOne(@Param('id') id: string): Promise<ResourceData> {
    return this.resourceService.findOne(id);
  }
  @Get('tools')
  @ApiOperation({
    summary: 'Get all tool resources',
    description: 'Returns all resources of type TOOLS',
  })
  @ApiOkResponse({
    description: 'Tool resources found successfully',
  })
  findTools(@GetUser() user: UserPayload) {
    return this.resourceService.findByType(ResourceType.TOOLS, user);
  }

  @Get('labor')
  @ApiOperation({
    summary: 'Get all labor resources',
    description: 'Returns all resources of type LABOR',
  })
  @ApiOkResponse({
    description: 'Labor resources found successfully',
  })
  findLabor(@GetUser() user: UserPayload) {
    return this.resourceService.findByType(ResourceType.LABOR, user);
  }

  @Get('supplies')
  @ApiOperation({
    summary: 'Get all supply resources',
    description: 'Returns all resources of type SUPPLIES',
  })
  @ApiOkResponse({
    description: 'Supply resources found successfully',
  })
  findSupplies(@GetUser() user: UserPayload) {
    return this.resourceService.findByType(ResourceType.SUPPLIES, user);
  }

  @Get('services')
  @ApiOperation({
    summary: 'Get all service resources',
    description: 'Returns all resources of type SERVICES',
  })
  @ApiOkResponse({
    description: 'Service resources found successfully',
  })
  findServices(@GetUser() user: UserPayload) {
    return this.resourceService.findByType(ResourceType.SERVICES, user);
  }

  @Delete('remove/all')
  @ApiOperation({
    summary: 'Desactive all resources',
    description: 'Desactive all resources',
  })
  @ApiOkResponse({
    description: 'Resources deactivated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input or resources not found',
  })
  deactivateAll(
    @Body() deleteResourcesDto: DeleteResourcesDto,
    @GetUser() user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.resourceService.removeAll(deleteResourcesDto, user);
  }
}
