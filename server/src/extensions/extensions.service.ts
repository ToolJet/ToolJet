import { Injectable } from '@nestjs/common';
import { CreateExtensionDto } from './dto/create-extension.dto';
import { UpdateExtensionDto } from './dto/update-extension.dto';

@Injectable()
export class ExtensionsService {
  create(createExtensionDto: CreateExtensionDto) {
    return 'This action adds a new extension';
  }

  findAll() {
    return `This action returns all extensions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} extension`;
  }

  update(id: number, updateExtensionDto: UpdateExtensionDto) {
    return `This action updates a #${id} extension`;
  }

  remove(id: number) {
    return `This action removes a #${id} extension`;
  }
}
