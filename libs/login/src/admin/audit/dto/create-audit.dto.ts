import { ApiProperty } from '@nestjs/swagger';
import { AuditActionType } from '@prisma/client';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CreateAuditDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  entityType: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  action: AuditActionType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  performedById: string;

  @ApiProperty()
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;
}
