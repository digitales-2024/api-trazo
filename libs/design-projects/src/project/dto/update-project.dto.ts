import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { UpdatePartialProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(UpdatePartialProjectDto) {
  @ApiProperty({ description: 'Project name', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Project location', required: false })
  @IsString()
  @IsOptional()
  ubicationProject?: string;

  @ApiProperty({ description: 'Province', required: false })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiProperty({ description: 'Department', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Client ID', required: false })
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @ApiProperty({ description: 'Quotation ID', required: false })
  @IsUUID()
  @IsOptional()
  quotationId?: string;

  @ApiProperty({ description: 'Designer ID', required: false })
  @IsUUID()
  @IsOptional()
  designerId?: string;
}
