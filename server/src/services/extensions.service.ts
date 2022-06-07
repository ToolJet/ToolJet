import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from 'src/entities/file.entity';
import { Extension } from 'src/entities/extension.entity';
import { Repository, Connection } from 'typeorm';
import { CreateFileDto } from '../dto/create-file.dto';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';
import { FilesService } from './files.service';
import { encode } from 'js-base64';
// import { Organization } from 'src/entities/organization.entity';

@Injectable()
export class ExtensionsService {
  constructor(
    private readonly filesService: FilesService,
    private connection: Connection,
    @InjectRepository(Extension)
    private extensionsRepository: Repository<Extension>
  ) {}
  async create(
    createExtensionDto: CreateExtensionDto,
    files: { operations: Express.Multer.File[]; icon: Express.Multer.File[]; manifest: Express.Multer.File[] }
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uploadedFiles: { operations?: File; icon?: File; manifest?: File } = {};
      await Promise.all(
        Object.keys(files).map(async (key) => {
          const file = files[key].pop();
          const str = file.buffer.toString('utf8');
          const fileDto = new CreateFileDto();
          fileDto.data = encode(str);
          fileDto.filename = file.originalname;
          uploadedFiles[key] = await this.filesService.create(fileDto, queryRunner);
        })
      );

      const extension = new Extension();
      extension.name = createExtensionDto.name;
      extension.operationsFileId = uploadedFiles.operations.id;
      extension.iconFileId = uploadedFiles.icon.id;
      extension.manifestFileId = uploadedFiles.manifest.id;

      // const org = new Organization();
      // org.id = createExtensionDto.organizationId;
      // extension.organizations = [org];

      return this.extensionsRepository.save(extension);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.extensionsRepository.find({ relations: ['iconFile', 'manifestFile'] });
  }

  async findOne(id: string) {
    const extension = await this.extensionsRepository.findOne({ where: { id } });
    if (!extension) {
      throw new NotFoundException('Extension not found');
    }
    return extension;
  }

  update(id: string, updateExtensionDto: UpdateExtensionDto) {
    return `This action updates a #${id} extension`;
  }

  remove(id: string) {
    return `This action removes a #${id} extension`;
  }
}
