import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class UpdateChecklistDto {
  @ApiPropertyOptional({
    description: 'Fecha para el plano arquitectónico',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  dateArchitectural?: string;

  @ApiPropertyOptional({
    description: 'Fecha para el plano estructural',
    example: '2024-02-10',
  })
  @IsOptional()
  @IsDateString()
  dateStructural?: string;

  @ApiPropertyOptional({
    description: 'Fecha para el plano eléctrico',
    example: '2024-03-05',
  })
  @IsOptional()
  @IsDateString()
  dateElectrical?: string;

  @ApiPropertyOptional({
    description: 'Fecha para el plano sanitario',
    example: '2024-03-25',
  })
  @IsOptional()
  @IsDateString()
  dateSanitary?: string;
}
