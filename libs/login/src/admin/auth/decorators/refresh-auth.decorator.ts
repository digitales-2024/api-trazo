import { applyDecorators, UseGuards } from '@nestjs/common';
import { RefreshAuthGuard } from '../guards/refresh-auth.guard';

export function RefreshAuth() {
  return applyDecorators(UseGuards(RefreshAuthGuard));
}
