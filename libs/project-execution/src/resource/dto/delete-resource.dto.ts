import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class DeleteResourcesDto {
  @ApiProperty({
    type: [String],
    description: 'Array of resource IDs to delete/reactivate',
  })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
