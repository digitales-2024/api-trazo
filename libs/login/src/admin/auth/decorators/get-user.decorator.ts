import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException
} from '@nestjs/common';
import { UserData } from '@login/login/interfaces';

export const GetUser = createParamDecorator((data, ctx: ExecutionContext): UserData => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  if (!user) throw new InternalServerErrorException('User not found');

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isSuperAdmin: user.isSuperAdmin,
    roles: user.roles
  };
});
