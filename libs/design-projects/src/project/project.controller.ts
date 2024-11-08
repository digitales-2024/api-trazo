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
import { UserData } from '@login/login/interfaces';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';
import { ExportProjectPdfDto } from './dto/export-project-pdf.dto';

@ApiTags('Design Projects')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'project', version: '1' })
@Auth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Design project created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDesignProjectDto: CreateProjectDto,
    @GetUser() user: UserData, // Obtener los datos del usuario autenticado
  ) {
    return this.projectService.create(createDesignProjectDto, user);
  }

  @Patch(':id/status')
  @ApiCreatedResponse({
    description: 'Design project status updated successfully',
  })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
    @GetUser() user: UserData,
  ) {
    return this.projectService.updateStatus(id, updateProjectStatusDto, user);
  }

  @Get(':id')
  @ApiCreatedResponse({
    description: 'Design project retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid project ID or project not found',
  })
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  // @Get()
  // findAll() {
  //   return this.projectService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.projectService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
  //   return this.projectService.update(+id, updateProjectDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.projectService.remove(+id);
  // }

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
