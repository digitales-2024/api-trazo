import { Controller, Post, Body, Get, Patch, Param, Delete, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Auth } from '../auth/decorators';
import { UpdateUserDto } from './dto';
import { SendEmailDto } from './dto/send-email.dto';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { HttpResponse, UserData, UserPayload } from '@login/login/interfaces';
import { DeleteUsersDto } from './dto/delete-users.dto';

@ApiTags('Users')
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Internal server error' })
@ApiBadRequestResponse({ description: 'Bad request' })
@Controller({
  path: 'users',
  version: '1'
})
@Auth()
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({ description: 'User created' })
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: UserData
  ): Promise<HttpResponse<UserData>> {
    return this.usersService.create(createUserDto, user);
  }

  @ApiOkResponse({ description: 'User updated' })
  @Patch(':id')
  update(@Body() updateUserDto: UpdateUserDto, @Param('id') id: string, @GetUser() user: UserData) {
    return this.usersService.update(updateUserDto, id, user);
  }

  @ApiOkResponse({ description: 'User deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<UserData>> {
    return this.usersService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Users deactivated' })
  @Delete('deactivate/all')
  deactivate(
    @Body() users: DeleteUsersDto,
    @GetUser() user: UserData
  ): Promise<Omit<HttpResponse, 'data'>> {
    return this.usersService.deactivate(users, user);
  }

  @ApiOkResponse({ description: 'Users reactivated' })
  @Patch('reactivate/all')
  reactivateAll(@GetUser() user: UserData, @Body() users: DeleteUsersDto) {
    return this.usersService.reactivateAll(user, users);
  }

  @ApiOkResponse({ description: 'User reactivated' })
  @Patch('reactivate/:id')
  reactivate(@Param('id') id: string, @GetUser() user: UserData): Promise<HttpResponse<UserData>> {
    return this.usersService.reactivate(id, user);
  }

  @ApiOkResponse({ description: 'Get all users' })
  @Get()
  findAll(@GetUser() user: UserPayload): Promise<UserPayload[]> {
    return this.usersService.findAll(user);
  }

  @ApiOkResponse({ description: 'Get user by id' })
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserData> {
    return this.usersService.findOne(id);
  }

  @ApiOkResponse({ description: 'Get new password' })
  @Post('generate-password')
  generatePassword(): { password: string } {
    return this.usersService.generatePassword();
  }

  @ApiOkResponse({ description: 'Send new password' })
  @Post('send-new-password')
  sendNewPassword(@Body() sendEmailDto: SendEmailDto, @GetUser() user: UserData) {
    return this.usersService.sendNewPassword(sendEmailDto, user);
  }
}
