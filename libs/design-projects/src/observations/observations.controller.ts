import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { Observation } from '@prisma/client';
import { DeleteObservationsDto } from './dto/delete-observation.dto';

@ApiTags('Observations')
@Controller({
  path: 'observations',
  version: '1',
})
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
export class ObservationsController {
  constructor(private readonly observationsService: ObservationsService) {}

  @Post()
  @ApiCreatedResponse({ description: 'Observation created successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid input or project charter not found',
  })
  create(
    @Body() createObservationDto: CreateObservationDto,
    @GetUser() user: UserData,
  ) {
    return this.observationsService.create(createObservationDto, user);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Observation found' })
  @ApiNotFoundResponse({ description: 'Observation not found' })
  findOne(@Param('id') id: string): Promise<Observation> {
    return this.observationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Observation updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Observation not found' })
  update(
    @Param('id') id: string,
    @Body() updateObservationDto: UpdateObservationDto,
    @GetUser() user: UserData,
  ) {
    return this.observationsService.update(id, updateObservationDto, user);
  }

  @Delete('remove/all')
  @ApiOkResponse({ description: 'Observations deleted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input' })
  @ApiNotFoundResponse({ description: 'Some observations not found' })
  removeAll(
    @Body() deleteObservationsDto: DeleteObservationsDto,
    @GetUser() user: UserData,
  ) {
    return this.observationsService.removeAll(deleteObservationsDto, user);
  }

  @Delete('project-charter/:id')
  @ApiOkResponse({
    description: 'All observations from project charter deleted successfully',
  })
  @ApiNotFoundResponse({ description: 'Project charter not found' })
  removeAllByProjectCharter(
    @Param('id') projectCharterId: string,
    @GetUser() user: UserData,
  ) {
    return this.observationsService.removeAllByProjectCharter(
      projectCharterId,
      user,
    );
  }
  @Get()
  @ApiOkResponse({ description: 'Get all observations' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(): Promise<Observation[]> {
    return this.observationsService.findAll();
  }

  @Get('project-charter/:id')
  @ApiOkResponse({ description: 'Get all observations for a project charter' })
  @ApiNotFoundResponse({
    description: 'Project charter not found or no observations',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAllByProjectCharter(
    @Param('id') projectCharterId: string,
  ): Promise<Observation[]> {
    return this.observationsService.findAllByProjectCharter(projectCharterId);
  }
}
