import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { UpdateMovementDto } from './dto/update-movement.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData } from '@login/login/interfaces';
import {
  MovementsData,
  MovementsDetailData,
  SummaryMovementsData,
} from '../interfaces';
import { TypeMovements } from '@prisma/client';

@ApiTags('Movements')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'movements', version: '1' })
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @ApiCreatedResponse({
    description: 'Movement successfully created',
  })
  @Post()
  create(
    @Body() createMovementDto: CreateMovementDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<MovementsData>> {
    return this.movementsService.create(createMovementDto, user);
  }

  @ApiOkResponse({ description: 'Get all movements' })
  @Get()
  findAll(): Promise<SummaryMovementsData[]> {
    return this.movementsService.findAll();
  }

  @ApiOkResponse({ description: 'Get movement by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<MovementsData> {
    return this.movementsService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get movements by type' })
  @ApiParam({
    name: 'type',
    required: true,
    description: 'Type of movements',
    enum: TypeMovements,
  })
  @Get('by-type/:type')
  findByType(
    @Param('type') type: TypeMovements,
  ): Promise<SummaryMovementsData[]> {
    return this.movementsService.findByType(type);
  }

  @ApiOkResponse({
    description: 'Get movements from Purchase Order ID',
  })
  @Get('/purchase/order/:id')
  findByPurchaseOrderId(@Param('id') id: string): Promise<MovementsData[]> {
    return this.movementsService.findByPurchaseOrderId(id);
  }

  @ApiOkResponse({
    description: 'Get missing movements from Purchase Order ID',
  })
  @Get('/missing/purchase/:id')
  findMissingMovementDetail(
    @Param('id') id: string,
  ): Promise<MovementsDetailData[]> {
    return this.movementsService.findMissingMovementDetail(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMovementDto: UpdateMovementDto,
    @GetUser() user: UserData,
  ) {
    return this.movementsService.update(id, updateMovementDto, user);
  }

  @ApiOkResponse({ description: 'Movement successfully deleted' })
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<MovementsData>> {
    return this.movementsService.remove(id, user);
  }
}
