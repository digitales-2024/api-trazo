import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsersService } from '../../users/users.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly userService: UsersService,
    configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies?.refresh_token; // Extraer el refresh token de la cookie HttpOnly
        }
      ]),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'), // Secreto para validar el refresh token
      passReqToCallback: true // Permite acceder al request en el método validate
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refresh_token; // Extraer el refresh token de la cookie
    // 1. Verificación: El refresh token existe
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    // 2. Verificar que el usuario existe
    const user = await this.userService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 3. Verificar que el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('User is not active, talk to the administrator');
    }

    // Devolvemos los datos del usuario y el token para que puedan ser utilizados en el servicio de autenticación
    return { ...payload, refreshToken };
  }
}
