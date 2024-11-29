import { PartialType } from '@nestjs/swagger';
import { CreateWorkitemDto } from './create-workitem.dto';

export class UpdateWorkitemDto extends PartialType(CreateWorkitemDto) {}
