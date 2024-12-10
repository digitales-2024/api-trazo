import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApuBudgetService } from './apu-budget.service';
import { CreateApuBudgetDto } from './dto/create-apu-budget.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { FullApuBudgetData } from '../interfaces';
import { UpdateApuBudgetDto } from './dto/update-apu-budget.dto';

@ApiTags('Apu Budget')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'apu-budget', version: '1' })
export class ApuBudgetController {
  constructor(private readonly apuBudgetService: ApuBudgetService) {}

  @ApiCreatedResponse({
    description: 'Apu Budget successfully created',
  })
  @Post()
  create(
    @Body() createApuBudgetDto: CreateApuBudgetDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<FullApuBudgetData>> {
    return this.apuBudgetService.create(createApuBudgetDto, user);
  }

  @ApiOkResponse({ description: 'Get APU Budget by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<FullApuBudgetData> {
    return this.apuBudgetService.findOne(id);
  }

  @ApiOkResponse({ description: 'APU Budget successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateApuBudgetDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<FullApuBudgetData>> {
    return this.apuBudgetService.update(id, updateClientDto, user);
  }
}
