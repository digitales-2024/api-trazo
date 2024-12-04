import { PartialType } from '@nestjs/swagger';
import { CreateApuBudgetDto } from './create-apu-budget.dto';

export class UpdateApuBudgetDto extends PartialType(CreateApuBudgetDto) {}
