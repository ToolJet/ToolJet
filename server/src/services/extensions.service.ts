import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Extension } from 'src/entities/extension.entity';
import { Repository, QueryRunner } from 'typeorm';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';
import { FileService } from './file.service';
import { encode } from 'js-base64';

@Injectable()
export class ExtensionsService {
  constructor(
    private readonly fileService: FileService,
    @InjectRepository(Extension)
    private extensionsRepository: Repository<Extension>
  ) {}
  async create(createExtensionDto: CreateExtensionDto, file: Express.Multer.File, queryRunner: QueryRunner) {
    const str = file.buffer.toString('utf8');
    const uploadedFile = await this.fileService.uploadFile(encode(str), file.originalname, queryRunner);
    createExtensionDto.file_id = uploadedFile.id;
    return this.extensionsRepository.create(createExtensionDto);
  }

  async findAll() {
    return await this.extensionsRepository.find();
  }

  async findOne(id: number) {
    const extension = await this.extensionsRepository.findOne({ where: { id } });
    if (!extension) {
      throw new NotFoundException('Extension not found');
    }
    return extension;
  }

  update(id: number, updateExtensionDto: UpdateExtensionDto) {
    return `This action updates a #${id} extension`;
  }

  remove(id: number) {
    return `This action removes a #${id} extension`;
  }
}
