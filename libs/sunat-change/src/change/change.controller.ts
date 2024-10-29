import { Controller, Get } from '@nestjs/common';
import { ChangeService } from './change.service';
import {
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '@login/login/admin/auth/decorators';

@ApiTags('change-sunat')
@ApiBadRequestResponse({ description: 'Solicitud incorrecta' })
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@Auth()
@Controller({ path: 'change-sunat', version: '1' })
export class ChangeController {
  constructor(private readonly changeService: ChangeService) {}

  @Get()
  async findAll(): Promise<string> {
    return this.changeService.findAll();
  }
}
