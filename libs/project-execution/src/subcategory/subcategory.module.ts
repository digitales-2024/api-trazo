import { forwardRef, Module } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';
import { SubcategoryController } from './subcategory.controller';
import { CategoryModule } from '../category/category.module';
import { PrismaModule } from '@prisma/prisma';

@Module({
  controllers: [SubcategoryController],
  providers: [SubcategoryService],
  imports: [PrismaModule, forwardRef(() => CategoryModule)],
})
export class SubcategoryModule {}
