import { InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';

export function handleException<T extends Error>(error: T, message: string): never {
  if (error instanceof InternalServerErrorException) {
    throw new ServiceUnavailableException('service unavailable, please try again later');
  } else {
    throw new InternalServerErrorException({
      message: message,
      error: error.message
    });
  }
}
