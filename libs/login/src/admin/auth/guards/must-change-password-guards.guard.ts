import { BadRequestException, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class MustChangePasswordGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const cookies = request.cookies;

    if (!cookies.access_token) {
      throw new BadRequestException('Token not found');
    }

    try {
      const user = request.user;
      if (user.mustChangePassword) {
        throw new BadRequestException('You must change your password');
      }
      return true;
    } catch (error) {
      throw new BadRequestException('Token invalid');
    }
  }
}
