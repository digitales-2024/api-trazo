import { Controller, Get, Param } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { UserData } from '@login/login/interfaces';

@ApiTags('Contracts')
@Controller({ path: 'contracts', version: '1' })
@Auth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @ApiOkResponse({
    description: 'Gets the contract for the quotation passed by id',
  })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserData) {
    return this.contractsService.findOne(id, user);
  }
}
