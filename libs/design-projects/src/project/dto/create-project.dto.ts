import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsJSON, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'JSON object containing meetings details',
    example: '[{"date": "2024-01-01", "topic": "Initial Discussion"}]',
  })
  @IsJSON()
  @IsNotEmpty()
  meetings: string;

  @ApiProperty({
    description: 'Location of the project',
    example: 'Lima, Peru',
  })
  @IsString()
  @IsNotEmpty()
  ubicationProject: string;

  @ApiProperty({
    description: 'Client ID associated with the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({
    description: 'Quotation ID associated with the project',
    example: '987e4567-e89b-12d3-a456-426614174321',
  })
  @IsUUID()
  @IsNotEmpty()
  quotationId: string;

  @ApiProperty({
    description: 'Designer ID assigned to the project',
    example: '456e4567-e89b-12d3-a456-426614174999',
  })
  @IsUUID()
  @IsNotEmpty()
  designerId: string;
}
