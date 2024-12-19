import { Controller, Get, Param } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseData, WarehouseData } from '../interfaces';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserPayload } from '@login/login/interfaces';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Warehouse')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'warehouse', version: '1' })
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @ApiOkResponse({ description: 'Get all warehouse' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<CreateWarehouseData[]> {
    return this.warehouseService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get warehouse by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<WarehouseData> {
    return this.warehouseService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get warehouse by execution project id' })
  @Get(':id')
  findWarehouseByExeuctionProject(
    @Param('/warehouse/execution/id') id: string,
  ): Promise<WarehouseData> {
    return this.warehouseService.findWarehouseByExeuctionProject(id);
  }
}
