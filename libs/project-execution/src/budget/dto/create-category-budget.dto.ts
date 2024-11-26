import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreateCategoryFromBudgetDto {
  @ApiProperty({
    name: 'categoryId',
    description: 'Id of the category',
    example: 'Id de la categoria',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    name: 'subtotal',
    description: 'Subtotal of the category',
  })
  subtotal: number;

  // subcategorias del presupuesto
  @ApiProperty({
    name: 'subcategory',
    description:
      'Array of subcategories and workitems or subworkitems that belong to this category',
    required: false,
    example: [
      {
        subcategoryId: 'id de la subcategoria',
        subtotal: 0,

        workitem: [
          {
            workitemId: 'id del workitem',
            quantity: 0,
            unitPrice: 0,
            subtotal: 0,
          },
        ],
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateSubcategoryBudgetDto)
  subcategory: CreateSubcategoryBudgetDto[];
}

export class CreateSubcategoryBudgetDto {
  @ApiProperty({
    name: 'subcategoryId',
    description: 'Id of the subcategory',
    example: 'Id de la subcategoria',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({
    name: 'subtotal',
    description: 'Subtotal of the subcategory',
  })
  subtotal: number;

  // items del presupuesto
  @ApiProperty({
    name: 'workitem',
    description:
      'Array of workitems or subworkitems that belong to this subcategory',
    required: false,
    example: [
      {
        workitemId: 'id del workitem',
        quantity: 0,
        unitPrice: 0,
        subtotal: 0,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkitemBudgetDto)
  workitem: CreateWorkitemBudgetDto[];
}

export class CreateWorkitemBudgetDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the workitem',
    required: false,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    name: 'unitCost',
    description: 'Unit cost of the workitem',
    required: false,
  })
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  unitCost?: number;

  @ApiProperty({
    name: 'subtotal',
    description: 'Subtotal of the workitem',
  })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @ApiProperty({
    name: 'workitemId',
    description: 'Id of the workitem',
    example: 'Id de la partida de obra',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  workitemId: string;

  // subpartidas de la partida de obra
  @ApiProperty({
    name: 'subworkitem',
    description: 'Array of subworkitems that belong to this workitem',
    required: false,
    example: [
      {
        subworkitemId: 'id de la subpartida de obra',
        quantity: 0,
        unitCost: 0,
        subtotal: 0,
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubworkitemBudgetDto)
  subworkitem?: CreateSubworkitemBudgetDto[];
}

export class CreateSubworkitemBudgetDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the subworkitem',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    name: 'unitCost',
    description: 'Unit cost of the subworkitem',
  })
  @IsNumber()
  @IsNotEmpty()
  unitCost: number;

  @ApiProperty({
    name: 'subtotal',
    description: 'Subtotal of the subworkitem',
  })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @ApiProperty({
    name: 'subworkitemId',
    description: 'Id of the subworkitem',
    example: 'Id de la subpartida de obra',
  })
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  subworkitemId: string;
}
