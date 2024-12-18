import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { PurchaseOrderData, SummaryPurchaseOrderData } from '../interfaces';
import { UpdatePurchaseOrderStatusDto } from './dto/update-status-purchase-order.dto';

@ApiTags('Purchase Order')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'purchase-order', version: '1' })
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @ApiCreatedResponse({
    description: 'Purchase order successfully created',
  })
  @Post()
  create(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<PurchaseOrderData>> {
    return this.purchaseOrderService.create(createPurchaseOrderDto, user);
  }

  @ApiOkResponse({ description: 'Get all purchase orders' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<SummaryPurchaseOrderData[]> {
    return this.purchaseOrderService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get purchase order by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<PurchaseOrderData> {
    return this.purchaseOrderService.findOne(id);
  }

  @ApiOkResponse({ description: 'Purchase order successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<PurchaseOrderData>> {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto, user);
  }

  @ApiOkResponse({ description: 'Purchase order status updated successfully' })
  @Patch('status/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() newStatus: UpdatePurchaseOrderStatusDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SummaryPurchaseOrderData>> {
    return await this.purchaseOrderService.updateStatus(id, newStatus, user);
  }
}
