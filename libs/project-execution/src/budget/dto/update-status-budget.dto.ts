import { ApiProperty } from '@nestjs/swagger';
import { BudgetStatusType } from '@prisma/client';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateBudgetStatusDto {
  @ApiProperty({
    name: 'newStatus',
    description:
      'New status to set the budget to. Can only be PENDING, APPROVED, REJECTED',
    example: 'PENDING',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'], {
    message: "newStatus must be either 'PENDING', 'APPROVED' or 'REJECTED'",
  })
  newStatus: BudgetStatusType;
}
