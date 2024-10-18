import { Reflector } from '@nestjs/core';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { META_ROLS } from '../decorators/rol-protected.decorator';

@Injectable()
export class UserRolGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const validRols: string[] = this.reflector.get<string[]>(META_ROLS, context.getHandler());

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!validRols) return true;
    if (validRols.length === 0) return true;

    for (const rol of validRols) {
      if (user.rol === rol) return true;
    }

    if (!user) throw new BadRequestException('User not found');

    throw new ForbiddenException('You do not have permission to access this resource');
  }
}
