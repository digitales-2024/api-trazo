import { Body, Controller, Get, Patch, Version } from '@nestjs/common';
import { Auth, GetUser } from './auth/decorators';
import { AdminService } from './admin.service';
import { UpdatePasswordDto } from './auth/dto/update-password.dto';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, UserData } from '@login/login/interfaces';

@ApiTags('Admin')
@ApiUnauthorizedResponse({
  description: 'Unauthorized'
})
@ApiBadRequestResponse({
  description: 'Bad request'
})
@Controller()
@Auth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOkResponse({ description: 'User profile' })
  @Get('profile')
  @Version('1')
  getProfile(@GetUser() user: UserData): UserData {
    return this.adminService.getProfile(user);
  }

  @ApiOkResponse({
    description: 'Password updated successfully'
  })
  @Patch('update-password')
  @Version('1')
  updatePassword(
    @Body() updatePassword: UpdatePasswordDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<string>> {
    return this.adminService.updatePassword(updatePassword, user);
  }
}
