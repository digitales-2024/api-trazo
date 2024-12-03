import { PartialType } from '@nestjs/swagger';
import { CreateSubworkitemDto } from './create-subworkitem.dto';

export class UpdateSubworkitemDto extends PartialType(CreateSubworkitemDto) {}
