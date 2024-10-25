import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateQuotationStatusDto {
  @ApiProperty({
    name: 'newStatus',
    description:
      'New status to set the quotation to. Can only be PENDING, APPROVED, REJECTED',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'], {
    message: "newStatus must be either 'PENDING', 'APPROVED' or 'REJECTED'",
  })
  newStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}
