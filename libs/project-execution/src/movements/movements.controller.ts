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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth, GetUser } from '@login/login/admin/auth/decorators';
import { HttpResponse, UserData } from '@login/login/interfaces';
import { MovementsData } from '../interfaces';

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

  @Get()
  findAll() {
    return this.movementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.movementsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMovementDto: UpdateMovementDto,
  ) {
    return this.movementsService.update(id, updateMovementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.movementsService.remove(id);
  }
}
