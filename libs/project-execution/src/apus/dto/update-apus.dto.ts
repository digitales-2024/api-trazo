import { PartialType } from '@nestjs/swagger';
import { CreateApusDto } from './create-apus.dto';

export class UpdateApusDto extends PartialType(CreateApusDto) {}
