import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  Get,
  Param,
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

@ApiTags('Design Projects')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'project', version: '1' })
@Auth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiCreatedResponse({ description: 'Design project created successfully' })
  @ApiBadRequestResponse({ description: 'Validation failed or bad request' })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Body() createDesignProjectDto: CreateProjectDto,
    @GetUser() user: UserData, // Obtener los datos del usuario autenticado
  ) {
    return this.projectService.create(createDesignProjectDto, user);
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
    description: 'Gets the contract for the quotation passed by id',
  })
  @Get(':id/pdf')
  genPdf(@Param('id') id: string, @GetUser() user: UserData) {
    return this.projectService.findOnePdf(id, user);
  }

  @ApiOkResponse({
    description: 'Gets the contract for the quotation passed by id',
  })
  @Get(':id/pdflayout')
  findOne(@Param('id') id: string, @GetUser() user: UserData) {
    return this.projectService.findOne(id, user);
  }
}
