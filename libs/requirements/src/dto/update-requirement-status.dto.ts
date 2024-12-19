import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RequirementDetailStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'The new status for the requirement detail.',
    enum: RequirementDetailStatus,
  })
  @IsEnum(RequirementDetailStatus)
  status: RequirementDetailStatus;
}
