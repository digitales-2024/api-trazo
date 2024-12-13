import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ExecutionProjectStatus } from '@prisma/client'; // Usa el enum de tu esquema Prisma.
import { Transform } from 'class-transformer';

export class UpdateExecutionProjectStatusDto {
  @ApiProperty({
    description: 'New status for the execution project',
  })
  @Transform(({ value }) => value?.toUpperCase()) // Transformar a mayúsculas
  @IsEnum(ExecutionProjectStatus, {
    message: `Status must be one of: ${Object.values(
      ExecutionProjectStatus,
    ).join(', ')}`,
  })
  @IsNotEmpty()
  newStatus: ExecutionProjectStatus;
}
