import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/create-observation.dto';
import {
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';
import { UpdateObservationDto } from './dto/update-observation.dto';
import { Observation } from '@prisma/client';

@ApiTags('Observations')
@Controller({
  path: 'observations',
  version: '1',
})
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
}
