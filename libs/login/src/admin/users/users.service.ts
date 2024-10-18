import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { PrismaService } from '@login/login/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from './dto';
import { handleException } from '@login/login/utils';
import { RolService } from '../rol/rol.service';
import { generate } from 'generate-password';
import { HttpResponse, Rol, UserData, UserPayload } from '@login/login/interfaces';
import { TypedEventEmitter } from '@login/login/event-emitter/typed-event-emitter.class';
import { SendEmailDto } from './dto/send-email.dto';
import { UpdatePasswordDto } from '../auth/dto/update-password.dto';
import { ValidRols } from '../auth/interfaces';
import { AuditService } from '../audit/audit.service';
import { AuditActionType } from '@prisma/client';
import { DeleteUsersDto } from './dto/delete-users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolService: RolService,
    private readonly eventEmitter: TypedEventEmitter,
    private readonly audit: AuditService
  ) {}

  /**
   * Crear un usuario en la base de datos
   * @param createUserDto Data del usuario a crear
   * @param user Usuario que crea el usuario
   * @returns Objetos con los datos del usuario creado
   */
  async create(createUserDto: CreateUserDto, user: UserData): Promise<HttpResponse<UserData>> {
    try {
      const newUser = await this.prisma.$transaction(async (prisma) => {
        const { roles, email, password, ...dataUser } = createUserDto;

        // Verificar que el rol exista y este activo

        if (!roles || roles.length === 0) {
          throw new BadRequestException('Roles is required');
        }

        for (const rol of roles) {
          const rolExist = await this.rolService.findById(rol);

          if (!rolExist) {
            throw new BadRequestException('Rol not found or inactive');
          }

          // Verificar que no se pueda crear un usuario con el rol superadmin
          const rolIsSuperAdmin = await this.rolService.isRolSuperAdmin(rol);

          if (rolIsSuperAdmin) {
            throw new BadRequestException('You cannot create a user with the superadmin role');
          }
        }

        // Verificamos si el email ya existe y este activo
        const existEmail = await this.checkEmailExist(email);

        if (existEmail) {
          throw new BadRequestException('Email already exists');
        }

        // Verificamos si el email ya existe y esta inactivo
        const inactiveEmail = await this.checkEmailInactive(email);

        if (inactiveEmail) {
          throw new BadRequestException({
            statusCode: HttpStatus.CONFLICT,
            message:
              'Email already exists but inactive, contact the administrator to reactivate the account',
            data: {
              id: (await this.findByEmailInactive(email)).id
            }
          });
        }

        // Encriptamos la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Creamos el usuario
        const newUser = await prisma.user.create({
          data: {
            email,
            ...dataUser,
            password: hashedPassword
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isSuperAdmin: true
          }
        });

        // Enviamos el usuario al correo con la contraseña temporal
        const emailResponse = await this.eventEmitter.emitAsync('user.welcome-admin-first', {
          name: newUser.name.toUpperCase(),
          email,
          password,
          webAdmin: process.env.WEB_URL
        });

        if (emailResponse.every((response) => response !== true)) {
          throw new BadRequestException('Failed to send email');
        }

        const userRoles: Omit<Rol, 'description'>[] = [];

        for (const rol of roles) {
          // Creamos la asignacion de un rol a un usuario
          const newUserRol = await prisma.userRol.create({
            data: {
              userId: newUser.id,
              rolId: rol
            },
            select: {
              rol: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          });

          userRoles.push({
            id: newUserRol.rol.id,
            name: newUserRol.rol.name
          });

          await this.audit.create({
            entityId: newUser.id,
            entityType: 'user',
            action: AuditActionType.CREATE,
            performedById: user.id,
            createdAt: new Date()
          });
        }

        return {
          ...newUser,
          roles: userRoles
        };
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: 'User created',
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          isSuperAdmin: newUser.isSuperAdmin,
          roles: newUser.roles
        }
      };
    } catch (error) {
      this.logger.error(`Error creating a user for email: ${createUserDto.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error creating a user');
    }
  }

  /**
   * Actualizar un usuario en la base de datos
   * @param updateUserDto Data del usuario a actualizar
   * @param id Id del usuario a actualizar
   * @param user Usuario que actualiza el usuario
   * @returns Data del usuario actualizado
   */
  async update(
    updateUserDto: UpdateUserDto,
    id: string,
    user: UserData
  ): Promise<HttpResponse<UserData>> {
    try {
      const userUpdate = await this.prisma.$transaction(async (prisma) => {
        const { roles, ...dataUser } = updateUserDto;

        // Verificar que el usuario exista
        const userDB = await prisma.user.findUnique({
          where: { id },
          include: { userRols: true }
        });
        if (!userDB) {
          throw new NotFoundException('User not found or inactive');
        }

        // Manejar roles
        if (roles && roles.length > 0) {
          // Obtener roles actuales del usuario
          const existingRoles = await prisma.userRol.findMany({
            where: {
              userId: id
            },
            select: {
              rolId: true
            }
          });

          const existingRoleIds = new Set(existingRoles.map((role) => role.rolId));
          const newRoleIds = new Set(roles);

          // Roles a eliminar (existentes pero no en el nuevo arreglo)
          const rolesToRemove = existingRoles
            .filter((role) => !newRoleIds.has(role.rolId))
            .map((role) => role.rolId);

          // Roles a agregar (nuevos que no existen actualmente)
          const rolesToAdd = roles.filter((role) => !existingRoleIds.has(role));

          // Eliminar roles no presentes en la actualización
          if (rolesToRemove.length > 0) {
            await prisma.userRol.deleteMany({
              where: {
                userId: id,
                rolId: {
                  in: rolesToRemove
                }
              }
            });
          }

          // Agregar nuevos roles
          for (const rolId of rolesToAdd) {
            const rolExist = await this.rolService.findById(rolId);
            if (!rolExist) {
              throw new BadRequestException(`Role with ID ${rolId} not found or inactive`);
            }

            const rolIsSuperAdmin = await this.rolService.isRolSuperAdmin(rolId);
            if (rolIsSuperAdmin) {
              throw new BadRequestException('You cannot update a user with the superadmin role');
            }

            // Verificar si el rol ya está asociado al usuario
            const roleAlreadyAssigned = await prisma.userRol.findUnique({
              where: {
                userId_rolId: {
                  userId: id,
                  rolId: rolId
                }
              }
            });

            if (!roleAlreadyAssigned) {
              await prisma.userRol.create({
                data: {
                  userId: id,
                  rolId: rolId
                }
              });
            }
          }
        }

        // Actualizar los datos del usuario
        const updateUser = await prisma.user.update({
          where: { id },
          data: dataUser,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isSuperAdmin: true,
            userRols: {
              select: {
                rol: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        await this.audit.create({
          entityId: id,
          entityType: 'user',
          action: AuditActionType.UPDATE,
          performedById: user.id,
          createdAt: new Date()
        });

        return updateUser;
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: {
          id: userUpdate.id,
          name: userUpdate.name,
          email: userUpdate.email,
          phone: userUpdate.phone,
          isSuperAdmin: userUpdate.isSuperAdmin,
          roles: userUpdate.userRols.map((rol) => ({
            id: rol.rol.id,
            name: rol.rol.name
          }))
        }
      };
    } catch (error) {
      this.logger.error(`Error updating a user for id: ${id}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'Error updating a user');
    }
  }

  /**
   * Eliminar un usuario en la base de datos
   * @param id Id del usuario a eliminar
   * @param user Usuario que elimina el usuario
   * @returns  Datos del usuario eliminado
   */
  async remove(id: string, user: UserData): Promise<HttpResponse<UserData>> {
    try {
      const userRemove = await this.prisma.$transaction(async (prisma) => {
        // Verificar que el usuario exista
        const userDB = await this.findById(id);
        if (!userDB) {
          throw new NotFoundException('User not found or inactive');
        }

        // No permitir que el usuario se elimine a sí mismo
        if (userDB.id === user.id) {
          throw new BadRequestException('You cannot delete yourself');
        }

        // Verificar si el usuario tiene algún rol de superadmin activo
        const superAdminRoles = await prisma.userRol.findMany({
          where: {
            userId: id,
            rol: {
              is: {
                name: ValidRols.SUPER_ADMIN
              }
            }
          }
        });

        if (superAdminRoles.length > 0) {
          throw new BadRequestException('You cannot delete a superadmin user');
        }

        // Marcar el usuario como inactivo
        await prisma.user.update({
          where: { id },
          data: {
            isActive: false
          }
        });

        await this.audit.create({
          entityId: id,
          entityType: 'user',
          action: AuditActionType.DELETE,
          performedById: user.id,
          createdAt: new Date()
        });

        // Eliminar todos los roles del usuario
        await prisma.userRol.updateMany({
          where: {
            userId: id
          },
          data: {
            isActive: false
          }
        });

        return {
          id: userDB.id,
          name: userDB.name,
          email: userDB.email,
          phone: userDB.phone,
          isSuperAdmin: userDB.isSuperAdmin,
          roles: userDB.roles
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User deleted',
        data: userRemove
      };
    } catch (error) {
      this.logger.error(`Error deleting a user for id: ${id}`, error.stack);
      handleException(error, 'Error deleting a user');
    }
  }

  /**
   * Desactivar todos los usuarios de un arreglo de usuarios
   * @param users Arreglo de usuarios a desactivar
   * @param user Usuario que desactiva los usuarios
   * @returns Retorna un mensaje de la desactivación correcta
   */
  async deactivate(users: DeleteUsersDto, user: UserData): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los usuarios en la base de datos
        const usersDB = await prisma.user.findMany({
          where: {
            id: { in: users.ids }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            userRols: {
              select: {
                rol: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        // Validar que se encontraron usuarios
        if (usersDB.length === 0) {
          throw new NotFoundException('Users not found or inactive');
        }

        // Validar que ningún usuario sea el mismo que realiza la desactivación
        if (usersDB.some((u) => u.id === user.id)) {
          throw new BadRequestException('You cannot deactivate yourself');
        }

        // Obtener todos los roles de SUPER_ADMIN en una sola consulta
        const superAdminUsers = await prisma.userRol.findMany({
          where: {
            userId: { in: usersDB.map((u) => u.id) },
            rol: { name: ValidRols.SUPER_ADMIN }
          },
          select: { userId: true }
        });

        const superAdminUserIds = new Set(superAdminUsers.map((r) => r.userId));
        if (usersDB.some((u) => superAdminUserIds.has(u.id))) {
          throw new BadRequestException('You cannot deactivate a superadmin user');
        }

        // Desactivar usuarios y eliminar roles
        const deactivatePromises = usersDB.map(async (userDelete) => {
          //Validar que este usuario no haya hecho una accion en el sistema
          const userAction = await prisma.audit.findFirst({
            where: {
              performedById: userDelete.id
            }
          });
          if (userAction) {
            // Desactivar usuario
            await prisma.user.update({
              where: { id: userDelete.id },
              data: { isActive: false }
            });

            // Desactivar roles
            await prisma.userRol.updateMany({
              where: { userId: userDelete.id },
              data: { isActive: false }
            });
          } else {
            // Eliminar roles
            await prisma.userRol.deleteMany({
              where: { userId: userDelete.id }
            });
            // Eliminar usuario
            await prisma.user.delete({
              where: { id: userDelete.id }
            });
          }

          // Auditoría
          await this.audit.create({
            entityId: user.id,
            entityType: 'user',
            action: AuditActionType.DELETE,
            performedById: user.id,
            createdAt: new Date()
          });

          return {
            id: userDelete.id,
            name: userDelete.name,
            email: userDelete.email,
            phone: userDelete.phone,
            roles: userDelete.userRols.map((rol) => ({
              id: rol.rol.id,
              name: rol.rol.name
            }))
          };
        });

        return Promise.all(deactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Users deactivated successfully'
      };
    } catch (error) {
      this.logger.error('Error deactivating users', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error deactivating users');
    }
  }

  /**
   * Reactivar un usuario en la base de datos
   * @param id Id del usuario a reactivar
   * @param user Usuario que reactiva el usuario
   * @returns Retorna un objeto con los datos del usuario reactivado
   */
  async reactivate(id: string, user: UserData): Promise<HttpResponse<UserData>> {
    try {
      const userReactivate = await this.prisma.$transaction(async (prisma) => {
        const userDB = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isSuperAdmin: true,
            isActive: true,
            userRols: {
              select: {
                rol: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        if (!userDB) {
          throw new NotFoundException('User not found');
        }

        if (userDB.isActive) {
          throw new BadRequestException('User is already active');
        }

        await prisma.user.update({
          where: { id },
          data: {
            isActive: true
          }
        });

        // Si el usuario se reactiva, entonces se reactivan todos los roles asociados
        await prisma.userRol.updateMany({
          where: {
            userId: id
          },
          data: {
            isActive: true
          }
        });

        // Crear un registro de auditoria
        await this.audit.create({
          entityId: id,
          entityType: 'user',
          action: AuditActionType.UPDATE,
          performedById: user.id,
          createdAt: new Date()
        });

        return {
          id: userDB.id,
          name: userDB.name,
          email: userDB.email,
          phone: userDB.phone,
          isSuperAdmin: userDB.isSuperAdmin,
          roles: userDB.userRols.map((rol) => {
            return {
              id: rol.rol.id,
              name: rol.rol.name
            };
          })
        };
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'User reactivated',
        data: userReactivate
      };
    } catch (error) {
      this.logger.error(`Error reactivating a user for id: ${id}`, error.stack);
      handleException(error, 'Error reactivating a user');
    }
  }

  /**
   * Reactivar varios usuarios seleccionadors en la base de datos
   * @param user Usuario que hara la reactivación
   * @param users Arreglo de los usuarios a reactivar
   * @return Retorna un mensaje de la reactivacion exitosa
   */
  async reactivateAll(user: UserData, users: DeleteUsersDto): Promise<Omit<HttpResponse, 'data'>> {
    try {
      await this.prisma.$transaction(async (prisma) => {
        // Buscar los usuarios en la base de datos
        const usersDB = await prisma.user.findMany({
          where: {
            id: { in: users.ids }
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            userRols: {
              select: {
                rol: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        // Validar que se encontraron usuarios
        if (usersDB.length === 0) {
          throw new NotFoundException('Users not found or inactive');
        }

        // Validar que ningún usuario sea el mismo que realiza la desactivación
        if (usersDB.some((u) => u.id === user.id)) {
          throw new BadRequestException('You cannot deactivate yourself');
        }

        // Obtener todos los roles de SUPER_ADMIN en una sola consulta
        const superAdminUsers = await prisma.userRol.findMany({
          where: {
            userId: { in: usersDB.map((u) => u.id) },
            rol: { name: ValidRols.SUPER_ADMIN }
          },
          select: { userId: true }
        });

        const superAdminUserIds = new Set(superAdminUsers.map((r) => r.userId));
        if (usersDB.some((u) => superAdminUserIds.has(u.id))) {
          throw new BadRequestException('You cannot deactivate a superadmin user');
        }

        // Reactivar usuarios y eliminar roles
        const reactivatePromises = usersDB.map(async (userDelete) => {
          // Desactivar usuario
          await prisma.user.update({
            where: { id: userDelete.id },
            data: { isActive: true }
          });

          // Reactivar los roles
          await prisma.userRol.updateMany({
            where: { userId: userDelete.id },
            data: { isActive: true }
          });

          // Auditoría
          await this.audit.create({
            entityId: user.id,
            entityType: 'user',
            action: AuditActionType.UPDATE,
            performedById: user.id,
            createdAt: new Date()
          });

          return {
            id: userDelete.id,
            name: userDelete.name,
            email: userDelete.email,
            phone: userDelete.phone,
            roles: userDelete.userRols.map((rol) => ({
              id: rol.rol.id,
              name: rol.rol.name
            }))
          };
        });

        return Promise.all(reactivatePromises);
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Users reactivate successfully'
      };
    } catch (error) {
      this.logger.error('Error reactivating users', error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error reactivating users');
    }
  }

  /**
   * Buscar todos los usuarios activos en la base de datos
   * @param user Usuario que busca los usuarios
   * @returns Retorna un array con los datos de los usuarios
   */
  async findAll(user: UserPayload): Promise<UserPayload[]> {
    // Verificar que el usuario tenga permisos para listar usuarios
    const canListUsers = user.roles.some((role) => role.name === ValidRols.SUPER_ADMIN);

    let usersDB: any[] = [];
    if (!canListUsers) {
      usersDB = await this.prisma.user.findMany({
        where: {
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          lastLogin: true,
          isActive: true,
          isSuperAdmin: true,
          mustChangePassword: true,
          userRols: {
            select: {
              rol: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      usersDB = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          lastLogin: true,
          isActive: true,
          isSuperAdmin: true,
          mustChangePassword: true,
          userRols: {
            select: {
              rol: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    return usersDB.map((user) => {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        isSuperAdmin: user.isSuperAdmin,
        mustChangePassword: user.mustChangePassword,
        roles: user.userRols.map((rol) => {
          return {
            id: rol.rol.id,
            name: rol.rol.name
          };
        })
      };
    });
  }

  /**
   * Buscar un usuario por su id
   * @param id Id del usuario
   * @returns Retorna un objeto con los datos del usuario
   */
  async findOne(id: string): Promise<UserData> {
    const userDB = await this.findById(id);

    return {
      id: userDB.id,
      name: userDB.name,
      email: userDB.email,
      phone: userDB.phone,
      isSuperAdmin: userDB.isSuperAdmin,
      roles: userDB.roles
    };
  }

  /**
   * Genera una contraseña aleatoria
   * @returns Contraseña aleatoria
   */
  generatePassword(): { password: string } {
    const password = generate({
      length: 10,
      numbers: true
    });

    return {
      password
    };
  }

  /**
   * Enviar un email al usuario con la contraseña temporal
   * @param sendEmailDto Data para enviar el email
   * @param user Usuario que envia el email
   * @returns Estado del envio del email
   */
  async sendNewPassword(sendEmailDto: SendEmailDto, user: UserData): Promise<HttpResponse<string>> {
    try {
      const { email, password } = sendEmailDto;

      const userDB = await this.findByEmail(email);
      // Encriptamos la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      const send = await this.prisma.$transaction(async (prisma) => {
        // Verificamos que el email ya existe y este activo
        const existEmail = await this.checkEmailExist(email);

        if (!existEmail) {
          throw new BadRequestException('Email not found');
        }

        // Verificamos si el email ya existe y esta inactivo
        const inactiveEmail = await this.checkEmailInactive(email);

        if (inactiveEmail) {
          throw new BadRequestException(
            'Email already exists but inactive, contact the administrator to reactivate the account'
          );
        }

        // Verificamos que no actualice su propia contraseña
        if (userDB.id === user.id) {
          throw new BadRequestException('You cannot update your own password');
        }

        await prisma.user.update({
          where: { id: userDB.id },
          data: {
            password: hashedPassword
          }
        });
        const emailResponse = await this.eventEmitter.emitAsync('user.new-password', {
          name: userDB.name.toUpperCase(),
          email,
          password,
          webAdmin: process.env.WEB_URL
        });

        if (emailResponse.every((response) => response === true)) {
          return {
            statusCode: HttpStatus.OK,
            message: `Email sent successfully`,
            data: sendEmailDto.email
          };
        } else {
          throw new BadRequestException('Failed to send email');
        }
      });
      return send;
    } catch (error) {
      this.logger.error(`Error sending email to: ${sendEmailDto.email}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      handleException(error, 'Error sending email');
    }
  }

  /**
   * Buscar un usuario por su email
   * @param email Email del usuario
   * @returns Retorna un objeto con los datos del usuario
   */
  async findByEmail(email: string): Promise<
    UserData & {
      password: string;
      mustChangePassword: boolean;
      isSuperAdmin: boolean;
    }
  > {
    const clientDB = await this.prisma.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        password: true,
        isSuperAdmin: true,
        mustChangePassword: true,
        userRols: {
          select: {
            rol: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!clientDB) {
      throw new NotFoundException('User not found');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email,
      phone: clientDB.phone,
      password: clientDB.password,
      isSuperAdmin: clientDB.isSuperAdmin,
      mustChangePassword: clientDB.mustChangePassword,
      roles: clientDB.userRols.map((rol) => {
        return {
          id: rol.rol.id,
          name: rol.rol.name
        };
      })
    };
  }

  /**
   * Verifica si el email ya existe en la base de datos
   * @param email Email del usuario
   * @return Retorna si el email ya existe o no
   */
  async checkEmailExist(email: string): Promise<boolean> {
    const clientDB = await this.prisma.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: true
        }
      }
    });

    return !!clientDB;
  }

  /**
   * Verifica si el email esta inactivo en la base de datos
   * @param email Email del usuario
   * @returns Retorna si el email esta inactivo o no
   */
  async checkEmailInactive(email: string): Promise<boolean> {
    const clientDB = await this.prisma.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: false
        }
      }
    });

    return !!clientDB;
  }

  /**
   * Busca un usuario inactivo por su email
   * @param email Email del usuario a buscar
   * @returns Datos del usuario encontrado
   */
  async findByEmailInactive(email: string): Promise<UserData> {
    const clientDB = await this.prisma.user.findUnique({
      where: {
        email_isActive: {
          email,
          isActive: false
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isSuperAdmin: true,
        userRols: {
          select: {
            rol: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!clientDB) {
      throw new NotFoundException('User not found');
    }

    return {
      id: clientDB.id,
      name: clientDB.name,
      email: clientDB.email,
      phone: clientDB.phone,
      isSuperAdmin: clientDB.isSuperAdmin,
      roles: clientDB.userRols.map((rol) => {
        return {
          id: rol.rol.id,
          name: rol.rol.name
        };
      })
    };
  }

  /**
   * Busca un usuario por su id y retorna un objeto con los datos del usuario
   * @param id Es el id del usuario
   * @returns  Retorna un objeto con los datos del usuario
   */
  async findById(id: string): Promise<UserPayload> {
    try {
      const clientDB = await this.prisma.user.findUnique({
        where: { id, isActive: true },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isSuperAdmin: true,
          lastLogin: true,
          isActive: true,
          mustChangePassword: true,
          userRols: {
            select: {
              rol: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!clientDB) {
        throw new NotFoundException('User not found');
      }
      return {
        id: clientDB.id,
        name: clientDB.name,
        email: clientDB.email,
        phone: clientDB.phone,
        isSuperAdmin: clientDB.isSuperAdmin,
        isActive: clientDB.isActive,
        lastLogin: clientDB.lastLogin,
        mustChangePassword: clientDB.mustChangePassword,
        roles: clientDB.userRols.map((rol) => {
          return {
            id: rol.rol.id,
            name: rol.rol.name
          };
        })
      };
    } catch (error) {
      this.logger.error(`Error finding user for id: ${id}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleException(error, 'Error finding user');
    }
  }

  /**
   * Actualiza la fecha de ultimo login del usuario
   * @param id Id del usuario a actualizar la fecha de ultimo login
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date()
      }
    });
  }

  /**
   * Actualiza la contraseña temporal del usuario
   * @param userId Id del usuario a actualizar la contraseña
   * @param updatePasswordDto Datos para actualizar la contraseña
   */
  async updatePasswordTemp(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<boolean> {
    try {
      const hashingPassword = bcrypt.hashSync(updatePasswordDto.newPassword, 10);

      const userUpdate = await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: hashingPassword,
          mustChangePassword: false
        }
      });

      return !!userUpdate;
    } catch (error) {
      this.logger.error(`Error updating password for user: ${userId}`, error.stack);
      handleException(error, 'Error updating password');
    }
  }
}
