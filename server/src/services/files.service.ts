import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateFileDto } from '../dto/create-file.dto';
import { UpdateFileDto } from '../dto/update-file.dto';
import { File } from '../entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>
  ) {}

  async create(createFileDto: CreateFileDto, manager: EntityManager) {
    const newFile = manager.create(File, {
      filename: createFileDto.filename,
      data: createFileDto.data,
    });
    await manager.save(File, newFile);
    return newFile;
  }

  findAll() {
    return `This action returns all files`;
  }

  async findOne(id: string) {
    const file = await this.fileRepository.findOne(id);
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }

  update(id: string, updateFileDto: UpdateFileDto) {
    return `This action updates a #${id} file`;
  }

  async remove(id: string, manager: EntityManager) {
    const deleteResponse = await manager.delete(File, id);
    if (!deleteResponse?.affected) {
      throw new NotFoundException();
    }
    return deleteResponse;
  }
}
