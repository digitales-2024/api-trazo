import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { RequirementService } from './requirements.service';
import {
  UpdateRequirements,
  RequirementsData,
  UpdateRequirementsDetail,
  RequirementsDetail,
  /* RequirementsWithDetailData, */
} from './requirement.interface';
import {
  UpdateRequirementDetailDto,
  UpdateRequirementDto,
} from './dto/update-requirement.dto';
import { UpdateStatusDto } from './dto/update-requirement-status.dto';

@ApiTags('Requirements')
@ApiBadRequestResponse({ description: 'Bad Request' })
@Auth()
@Controller({ path: 'requirement', version: '1' })
export class RequirementsController {
  constructor(private readonly requirementService: RequirementService) {}

  // Crear nuevo Requerimiento
  @ApiCreatedResponse({
    description: 'Requirement successfully created',
  })
  @Post()
  create(
    @Body() createRequirementDto: CreateRequirementDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<RequirementsData>> {
    return this.requirementService.create(createRequirementDto, user);
  }

  // Obtener todos los requerimientos
  @ApiCreatedResponse({
    description: 'Get all requirements',
  })
  @Get()
  findAll(): Promise<HttpResponse<RequirementsData[]>> {
    return this.requirementService.findAll();
  }

  // Actualizar un Requerimiento
  @ApiOkResponse({
    description: 'Requirement successfully updated',
  })
  @Patch(':id')
  @ApiBody({
    description: 'Update requirement data',
    type: UpdateRequirementDto,
  })
  updateRequirement(
    @Param('id') id: string,
    @Body() updateRequirementDto: UpdateRequirementDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<UpdateRequirements>> {
    return this.requirementService.updateRequirement(
      id,
      updateRequirementDto,
      user,
    );
  }

  // Actualizar un Detalle Requerimiento
  @ApiOkResponse({
    description: 'Requirement detail successfully updated',
  })
  @Patch('/detail/:id')
  @ApiBody({
    description: 'Update requirement detail data',
    type: UpdateRequirementDetailDto,
  })
  updateRequirementDetails(
    @Param('id') id: string,
    @Body() updateRequirementDto: UpdateRequirementDetailDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<UpdateRequirementsDetail>> {
    return this.requirementService.updateRequirementDetails(
      id,
      updateRequirementDto,
      user,
    );
  }

  // Actualizar el estado de un detalle de requerimiento
  @Patch('/details/status/:detailId')
  @ApiOkResponse({
    description: 'Requirement detail status updated successfully',
  })
  @ApiBody({
    description: 'Status update for the requirement detail',
    type: UpdateStatusDto,
  })
  async updateRequirementDetailStatus(
    @Param('detailId') detailId: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @GetUser() user: UserData,
  ) {
    return this.requirementService.updateStatus(
      detailId,
      updateStatusDto.status,
      user.id,
    );
  }

  // Buscar detalles de requerimientos asociados a un requerimiento
  @ApiOkResponse({
    description: 'Get requirements detail by execution requirement ID',
  })
  @Get('detail/:requirementId')
  async getRequirementsDetailByRequirementId(
    @Param('requirementId') requirementId: string,
  ): Promise<HttpResponse<RequirementsDetail[]>> {
    return this.requirementService.findRequirementsDetailByRequirementId(
      requirementId,
    );
  }

  // Buscar requerimientos asociados a un proyecto de ejecución
  @ApiOkResponse({
    description: 'Get requirements by exection project ID',
  })
  @Get('/execution-project/:executionProjectId')
  async getRequirementsByExecutionProjectId(
    @Param('executionProjectId') executionProjectId: string,
  ): Promise<HttpResponse<RequirementsData[]>> {
    return this.requirementService.findRequirementsByExecutionProject(
      executionProjectId,
    );
  }
}
