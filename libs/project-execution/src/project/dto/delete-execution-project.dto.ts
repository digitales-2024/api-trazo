import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class DeleteExecutionProjectDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
