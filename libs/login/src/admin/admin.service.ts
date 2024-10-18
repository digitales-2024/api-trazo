import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { UpdatePasswordDto } from './auth/dto/update-password.dto';
import { PrismaService } from '@login/login/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { HttpResponse, UserData } from '@login/login/interfaces';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Obtiene los datos del usuario logueado
   * @param user Usuario logueado
   * @returns Data del usuario logueado
   */
  getProfile(user: UserData): UserData {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isSuperAdmin: user.isSuperAdmin,
      roles: user.roles
    };
  }
  /**
   * Actualizar la contraseña del usuario
   * @param updatePassword Datos para actualizar la contraseña
   * @param user Usuario que realiza la actualización
   * @returns Datos de la actualización
   */
  async updatePassword(
    updatePassword: UpdatePasswordDto,
    user: UserData
  ): Promise<HttpResponse<string>> {
    const { email } = user;

    const { password, newPassword, confirmPassword } = updatePassword;

    const userDB = await this.prismaService.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      }
    });

    const isMatching = await bcrypt.compare(password, userDB.password);

    if (!isMatching) {
      throw new BadRequestException('Password incorrect');
    }

    if (newPassword === password) {
      throw new BadRequestException('New password must be different from the current password');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: {
        id: userDB.id
      },
      data: {
        password: hashedPassword
      }
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Password updated successfully',
      data: userDB.email
    };
  }
}
