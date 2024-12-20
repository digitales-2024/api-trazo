import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  Delete,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { ExportProjectPdfDto } from './dto/export-project-pdf.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateChecklistDto } from './dto/update-checklist.dto';
import { DeleteChecklistDto } from './dto/delete-checklist.dto';
import {
  DesignProjectData,
  DesignProjectSummaryData,
  ProjectStatusUpdateData,
} from '../interfaces/project.interfaces';

@ApiTags('Design Projects')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'design-project', version: '1' })
@Auth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Design project created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDesignProjectDto: CreateProjectDto,
    @GetUser() user: UserData,
  ) {
    return this.projectService.create(createDesignProjectDto, user);
  }

  @Get('quotation-for-create')
  @ApiOkResponse({
    description:
      'Get all quotations that can be used to create a Project (approved, and not linked to another project)',
  })
  findCreatable() {
    return this.projectService.findCreatable();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Design project retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid project ID or project not found',
  })
  findOne(@Param('id') id: string): Promise<DesignProjectData> {
    return this.projectService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Design project updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<DesignProjectData>> {
    return this.projectService.update(id, updateProjectDto, user);
  }

  @Patch(':id/status')
  @ApiOkResponse({
    description: 'Design project status updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ProjectStatusUpdateData>> {
    return this.projectService.updateStatus(id, updateProjectStatusDto, user);
  }

  @Patch(':id/checklist')
  @ApiOkResponse({ description: 'Checklist updated successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  updateChecklist(
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse> {
    return this.projectService.updateChecklist(id, updateChecklistDto, user);
  }

  @ApiOkResponse({ description: 'Checklist remove succesfully' })
  @Delete(':id/checklist')
  deleteChecklist(
    @Param('id') id: string,
    @Body() deleteChecklistDto: DeleteChecklistDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse> {
    return this.projectService.deleteChecklist(id, deleteChecklistDto, user);
  }

  @Get()
  @ApiOkResponse({
    description: 'Get all design projects',
  })
  findAll(@GetUser() user: UserPayload): Promise<DesignProjectSummaryData[]> {
    return this.projectService.findAll(user);
  }

  @Get('/status/completed')
  @ApiOkResponse({
    description: 'Get all design projects that are completed',
  })
  findCompletedDesignProjects(): Promise<DesignProjectSummaryData[]> {
    return this.projectService.findCompletedDesignProjects();
  }

  @ApiOkResponse({
    description: 'Gets the contract for the project passed by id',
  })
  @Post(':id/pdf')
  genPdf(@Body() exportDto: ExportProjectPdfDto, @Param('id') id: string) {
    return this.projectService.findOnePdf(id, exportDto);
  }

  @ApiOkResponse({
    description: 'Gets the contract for the project passed by id',
  })
  @Get(':id/pdflayout')
  genPdfLayout(@Param('id') id: string) {
    return this.projectService.genPdfLayout(id);
  }
}
