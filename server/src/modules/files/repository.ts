import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CreateFileDto, UpdateFileDto } from '@modules/files/dto';
import { File } from '@entities/file.entity';

@Injectable()
export class FilesRepository extends Repository<File> {
  constructor(private dataSource: DataSource) {
    super(File, dataSource.createEntityManager());
  }

  async createOne(createFileDto: CreateFileDto, manager: EntityManager) {
    const newFile = manager.create(File, {
      filename: createFileDto.filename,
      data: createFileDto.data,
    });
    await manager.save(File, newFile);
    return newFile;
  }

  async getOne(id: string) {
    const file = await this.manager.findOne(File, {
      where: { id },
    });
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }

  async updateOne(id: string, updateFileDto: UpdateFileDto, manager: EntityManager) {
    const newFile = await manager.update(
      File,
      { id },
      {
        data: updateFileDto.data,
      }
    );
    return newFile;
  }

  async removeOne(id: string, manager: EntityManager) {
    const deleteResponse = await manager.delete(File, id);
    if (!deleteResponse?.affected) {
      throw new NotFoundException();
    }
    return deleteResponse;
  }
}
