import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class DeleteChecklistDto {
  @ApiProperty({
    description: 'Fechas del checklist a borrar',
    example: ['dateArchitectural', 'dateElectrical'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  datesToDelete: (
    | 'dateArchitectural'
    | 'dateStructural'
    | 'dateElectrical'
    | 'dateSanitary'
  )[];
}
