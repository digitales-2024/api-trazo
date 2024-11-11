import { Controller, Get, Param } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '@login/login/admin/auth/decorators';

@ApiTags('Meetings')
@ApiBadRequestResponse({ description: 'Bad Request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller({ path: 'meetings', version: '1' })
@Auth()
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @ApiOkResponse({
    description: 'Gets the contract for the project passed by id',
  })
  @Get(':id/pdflayout')
  genPdfLayout(@Param('id') id: string) {
    return this.meetingsService.genPdfLayout(id);
  }
}
