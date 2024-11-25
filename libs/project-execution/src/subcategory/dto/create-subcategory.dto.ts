import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSubcategoryDto {
  @ApiProperty({
    name: 'name',
    description: 'Category name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name: string;

  @ApiProperty({
    name: 'categoryId',
    description: 'Category id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;
}
