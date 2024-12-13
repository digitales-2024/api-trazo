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
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { ClientData, ClientDescriptionData } from '@clients/clients/interfaces';
import { DeleteClientsDto } from './dto/delete-client.dto';

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

  @ApiOkResponse({ description: 'Get all clients' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<ClientDescriptionData[]> {
    return this.clientsService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get client by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<ClientData> {
    return this.clientsService.findOne(id);
  }

  @ApiOkResponse({ description: 'Client successfully updated' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @GetUser() user: UserData,
  ): Promise<HttpResponse<ClientData>> {
    return this.clientsService.update(id, updateClientDto, user);
  }

  @ApiOkResponse({ description: 'Clients deactivated' })
  @Delete('remove/all')
  deactivate(
    @Body() clients: DeleteClientsDto,
    @GetUser() user: UserData,
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.clientsService.removeAll(clients, user);
  }

  @ApiOkResponse({ description: 'Clients reactivated' })
  @Patch('reactivate/all')
  reactivateAll(@GetUser() user: UserData, @Body() clients: DeleteClientsDto) {
    return this.clientsService.reactivateAll(user, clients);
  }
}
