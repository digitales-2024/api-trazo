import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DesignProjectStatus } from '@prisma/client'; // Usa el enum de tu esquema Prisma.
import { Transform } from 'class-transformer';

export class UpdateProjectStatusDto {
  @ApiProperty({
    description: 'New status for the design project',
    example: 'ENGINEERING',
  })
  @Transform(({ value }) => value?.toUpperCase()) // Transformar a mayúsculas
  @IsEnum(DesignProjectStatus, {
    message: `Status must be one of: ${Object.values(DesignProjectStatus).join(
      ', ',
    )}`,
  })
  @IsNotEmpty()
  newStatus: DesignProjectStatus;
}
