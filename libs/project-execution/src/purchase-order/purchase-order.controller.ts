import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<PurchaseOrderData>> {
    return this.purchaseOrderService.update(id, updatePurchaseOrderDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.purchaseOrderService.remove(id);
  }
}
