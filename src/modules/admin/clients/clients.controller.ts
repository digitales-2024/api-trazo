import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { ClientData } from 'src/interfaces';

@ApiTags('Client')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Auth()
@Controller({ path: 'clients', version: '1' })
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @ApiCreatedResponse({
    description: 'Client successfully created',
  })
  @Post()
  create(
    @Body() createClientDto: CreateClientDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ClientData>> {
    return this.clientsService.create(createClientDto, user);
  }

  @ApiCreatedResponse({ description: 'Get all clients' })
  @Get()
  findAll(@GetUser() user: UserPayload) {
    return this.clientsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClientData> {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(+id, updateClientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clientsService.remove(+id);
  }
}
