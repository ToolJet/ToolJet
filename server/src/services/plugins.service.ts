import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from 'src/entities/file.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { Repository, Connection } from 'typeorm';
import { CreateFileDto } from '../dto/create-file.dto';
import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { FilesService } from './files.service';
import { encode } from 'js-base64';

@Injectable()
export class PluginsService {
  constructor(
    private readonly filesService: FilesService,
    private connection: Connection,
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>
  ) {}
  async create(
    createPluginDto: CreatePluginDto,
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

      const plugin = new Plugin();
      plugin.name = createPluginDto.name;
      plugin.version = createPluginDto.version;
      plugin.operationsFileId = uploadedFiles.operations.id;
      plugin.iconFileId = uploadedFiles.icon.id;
      plugin.manifestFileId = uploadedFiles.manifest.id;

      return this.pluginsRepository.save(plugin);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.pluginsRepository.find({ relations: ['iconFile', 'manifestFile'] });
  }

  async findOne(id: string) {
    const plugin = await this.pluginsRepository.findOne({ where: { id }, relations: ['operationsFile'] });
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }
    return plugin;
  }

  update(id: string, updatePluginDto: UpdatePluginDto) {
    return `This action updates a #${id} plugin`;
  }

  remove(id: string) {
    return `This action removes a #${id} plugin`;
  }
}
