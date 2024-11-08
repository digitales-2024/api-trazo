import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';
import { UpdateProjectStatusDto } from './dto/update-project-status.dto';

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
}
