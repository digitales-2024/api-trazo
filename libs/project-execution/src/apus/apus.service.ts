import { Injectable } from '@nestjs/common';
import { CreateApusDto } from './dto/create-apus.dto';
import { UpdateApusDto } from './dto/update-apus.dto';

@Injectable()
export class ApusService {
  create(createApusDto: CreateApusDto) {
    return 'This action adds a new apus';
  }

  findAll() {
    return `This action returns all apus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apus`;
  }

  update(id: number, updateApusDto: UpdateApusDto) {
    return `This action updates a #${id} apus`;
  }

  remove(id: number) {
    return `This action removes a #${id} apus`;
  }
}
