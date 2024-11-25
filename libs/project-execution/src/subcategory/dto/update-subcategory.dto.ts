import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSubcategoryDto } from './create-subcategory.dto';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSubcategoryDto extends PartialType(CreateSubcategoryDto) {
  @ApiProperty({
    name: 'name',
    description: 'Category name',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim().toLowerCase())
  name?: string;

  @ApiProperty({
    name: 'categoryId',
    description: 'Category id',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  categoryId?: string;
}
