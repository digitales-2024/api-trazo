import { forwardRef, Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaModule } from '@prisma/prisma';
import { SubcategoryModule } from '../subcategory/subcategory.module';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  imports: [PrismaModule, forwardRef(() => SubcategoryModule)],
})
export class CategoryModule {}
