import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
import { ExecutionProjectService } from './project.service';
import { CreateExecutionProjectDto } from './dto/create-execution-project.dto';
import { UpdateExecutionProjectDto } from './dto/update-execution-project.dto';
import { UpdateExecutionProjectStatusDto } from './dto/update-execution-project-status.dto';
import {
  ExecutionProjectSummaryData,
  ExecutionProjectData,
  ExecutionProjectStatusUpdateData,
} from '../interfaces/project.interface';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Execution Projects')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'execution-project', version: '1' })
@Auth()
export class ExecutionProjectController {
  constructor(private readonly projectService: ExecutionProjectService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Execution project created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createExecutionProjectDto: CreateExecutionProjectDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse> {
    return this.projectService.create(createExecutionProjectDto, user);
  }

  @Get()
  @ApiOkResponse({ description: 'Get all execution projects' })
  findAll(
    @GetUser() user: UserPayload,
  ): Promise<ExecutionProjectSummaryData[]> {
    return this.projectService.findAll(user);
  }

  @Get('/status/completed')
  @ApiOkResponse({
    description: 'Get all completed execution projects',
  })
  findCompletedExecutionProjects(): Promise<ExecutionProjectSummaryData[]> {
    return this.projectService.findCompletedExecutionProjects();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Execution project retrieved successfully' })
  findOne(@Param('id') id: string): Promise<ExecutionProjectData> {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Execution project updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateExecutionProjectDto: UpdateExecutionProjectDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ExecutionProjectData>> {
    return this.projectService.update(id, updateExecutionProjectDto, user);
  }

  @Patch(':id/status')
  @ApiOkResponse({
    description: 'Execution project status updated successfully',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() updateExecutionStatusDto: UpdateExecutionProjectStatusDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ExecutionProjectStatusUpdateData>> {
    return this.projectService.updateStatus(id, updateExecutionStatusDto, user);
  }
}
