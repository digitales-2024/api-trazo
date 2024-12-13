import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ProjectCharterService } from './project-charter.service';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { ProjectCharterData } from '../interfaces';
import { HttpResponse, UserData } from '@login/login/interfaces';

@Controller({
  path: 'project-charter',
  version: '1',
})
@ApiTags('Project Charter')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
export class ProjectCharterController {
  constructor(private readonly projectCharterService: ProjectCharterService) {}

  @Get(':id')
  @ApiOkResponse({ description: 'Get project charter by id' })
  @ApiNotFoundResponse({ description: 'Project charter not found' })
  findOne(@Param('id') id: string): Promise<ProjectCharterData> {
    return this.projectCharterService.findOne(id);
  }

  @Get()
  @ApiOkResponse({
    description: 'Get all project charters',
  })
  findAll(): Promise<ProjectCharterData[]> {
    return this.projectCharterService.findAll();
  }

  @ApiOkResponse({ description: 'Pre-project approval toggle approved' })
  @Patch('toggleapproved/:id')
  toggleApproved(
    @Param('id') id: string,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ProjectCharterData>> {
    return this.projectCharterService.toggleApproved(id, user);
  }
}
