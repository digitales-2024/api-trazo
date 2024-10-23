import { Controller, Post, Body } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';
import { ApiCreatedResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Auth } from '../auth/decorators';

@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiTags('Audit')
@Auth()
@Controller({
  path: 'audit',
  version: '1'
})
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiCreatedResponse({ description: 'Audit created' })
  @Post()
  create(@Body() createAuditDto: CreateAuditDto) {
    return this.auditService.create(createAuditDto);
  }
}
