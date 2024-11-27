import { Injectable } from '@nestjs/common';
import { CreateWorkitemDto } from './dto/create-workitem.dto';
import { UpdateWorkitemDto } from './dto/update-workitem.dto';

@Injectable()
export class WorkitemsService {
  create(createWorkitemDto: CreateWorkitemDto) {
    return 'This action adds a new workitem';
  }

  findAll() {
    return `This action returns all workitems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workitem`;
  }

  update(id: number, updateWorkitemDto: UpdateWorkitemDto) {
    return `This action updates a #${id} workitem`;
  }

  remove(id: number) {
    return `This action removes a #${id} workitem`;
  }
}
