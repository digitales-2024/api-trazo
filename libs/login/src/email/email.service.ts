import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventPayloads } from '@login/login/interfaces/event-types.interface';
import { getFirstWord } from '@login/login/utils';

const infoBusiness = {
  business: 'Chaqchao',
  url: 'https://chaqchao.com',
  phone: '+51 999 999 998',
  address: '1234 Street',
  contact: 'contacto@gmail.com'
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('user.welcome-admin-first')
  async welcomeEmail(data: EventPayloads['user.welcome-admin-first']): Promise<boolean> {
    const { name, email, password, webAdmin } = data;
    const subject = `Bienvenido a ${infoBusiness.business}: ${getFirstWord(name)}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'welcome-admin-first',
        context: {
          name,
          email,
          password,
          webAdmin,
          business: infoBusiness.business,
          url: infoBusiness.url,
          phone: infoBusiness.phone,
          address: infoBusiness.address,
          contact: infoBusiness.contact
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('client.forgot-password')
  async forgotPassword(data: EventPayloads['client.forgot-password']): Promise<boolean> {
    const { name, email, link } = data;
    const subject = `Recuperar contraseña de ${infoBusiness.business}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'forgot-password',
        context: {
          name,
          email,
          link,
          business: infoBusiness.business,
          url: infoBusiness.url,
          phone: infoBusiness.phone,
          address: infoBusiness.address,
          contact: infoBusiness.contact
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }

  @OnEvent('user.new-password')
  async newPassword(data: EventPayloads['user.new-password']): Promise<boolean> {
    const { name, email, password, webAdmin } = data;
    const subject = `Hola de nuevo: ${getFirstWord(name)}`;

    try {
      const sendingEmail = await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'new-password',
        context: {
          name,
          email,
          password,
          webAdmin,
          business: infoBusiness.business,
          url: infoBusiness.url,
          phone: infoBusiness.phone,
          address: infoBusiness.address,
          contact: infoBusiness.contact
        }
      });

      if (sendingEmail) {
        return true; // Retorna true indicando éxito
      } else {
        return false; // Retorna false indicando fallo
      }
    } catch (error) {
      this.logger.error(error);
      return false; // Retorna false indicando fallo
    }
  }


}
