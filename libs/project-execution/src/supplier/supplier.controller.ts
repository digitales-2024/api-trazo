import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { SupplierData, SupplierDescriptionData } from '../interfaces';
import { DeleteSuppliersDto } from './dto/delete-supplier.dto';

@ApiTags('Supplier')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'supplier', version: '1' })
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @ApiCreatedResponse({
    description: 'Supplier successfully created',
  })
  @Post()
  create(
    @Body() createSupplierDto: CreateSupplierDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SupplierData>> {
    return this.supplierService.create(createSupplierDto, user);
  }

  @ApiOkResponse({ description: 'Get all suppliers' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<SupplierDescriptionData[]> {
    return this.supplierService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get supplier by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<SupplierData> {
    return this.supplierService.findOne(id);
  }

  @ApiOkResponse({ description: 'Supplier successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<SupplierData>> {
    return this.supplierService.update(id, updateSupplierDto, user);
  }

  @ApiOkResponse({ description: 'Suppliers deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() suppliers: DeleteSuppliersDto,
    @GetUser() user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.supplierService.removeAll(suppliers, user);
  }

  @ApiOkResponse({ description: 'Suppliers reactivated' })
  @Patch('reactivate/all')
  reactivateAll(
    @GetUser() user: UserData,
    @Body() suppliers: DeleteSuppliersDto,
  ) {
    return this.supplierService.reactivateAll(user, suppliers);
  }
}
