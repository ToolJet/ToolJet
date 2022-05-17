import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Extension } from 'src/entities/extension.entity';
import { Repository } from 'typeorm';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';

@Injectable()
export class ExtensionsService {
  constructor(
    @InjectRepository(Extension)
    private extensionsRepository: Repository<Extension>
  ) {}
  create(createExtensionDto: CreateExtensionDto) {
    return 'This action adds a new extension';
  }

  async findAll() {
    return await this.extensionsRepository.find();
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
