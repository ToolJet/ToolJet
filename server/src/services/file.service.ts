import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { File } from '../entities/file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>
  ) {}

  async uploadFile(dataBuffer: any, filename: string, queryRunner: QueryRunner) {
    const newFile = await queryRunner.manager.create(File, {
      filename,
      data: dataBuffer,
    });
    try {
      await queryRunner.manager.save(File, newFile);
    } catch (error) {
      console.log(error);
    }
    return newFile;
  }

  async deleteFile(fileId: string, queryRunner: QueryRunner) {
    const deleteResponse = await queryRunner.manager.delete(File, fileId);
    if (!deleteResponse.affected) {
      throw new NotFoundException();
    }
  }

  async getFileById(fileId: string) {
    const file = await this.fileRepository.findOne(fileId);
    if (!file) {
      throw new NotFoundException();
    }
    return file;
  }
}
