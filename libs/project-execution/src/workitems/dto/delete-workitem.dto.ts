import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteWorkItemDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
