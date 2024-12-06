import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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
}
