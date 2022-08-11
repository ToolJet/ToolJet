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
    files: { index: ArrayBuffer; operations: ArrayBuffer; icon: ArrayBuffer; manifest: ArrayBuffer }
  ) {
    const queryRunner = this.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
      await Promise.all(
        Object.keys(files).map(async (key) => {
          const file = files[key];
          const fileDto = new CreateFileDto();
          fileDto.data = encode(file);
          fileDto.filename = key;
          uploadedFiles[key] = await this.filesService.create(fileDto, queryRunner);
        })
      );

      const plugin = new Plugin();
      plugin.pluginId = createPluginDto.id;
      plugin.name = createPluginDto.name;
      plugin.version = createPluginDto.version;
      plugin.description = createPluginDto.description;
      plugin.indexFileId = uploadedFiles.index.id;
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
    const plugin = await this.pluginsRepository.findOne({ where: { id }, relations: ['indexFile'] });
    if (!plugin) {
      throw new NotFoundException('Plugin not found');
    }
    return plugin;
  }

  async fetchPluginFiles(id: string) {
    const promises = await Promise.all([
      fetch(`${process.env.MARKETPLACE_URL}/marketplace-assets/${id}/dist/index.js`),
      fetch(`${process.env.MARKETPLACE_URL}/marketplace-assets/${id}/lib/operations.json`),
      fetch(`${process.env.MARKETPLACE_URL}/marketplace-assets/${id}/lib/icon.svg`),
      fetch(`${process.env.MARKETPLACE_URL}/marketplace-assets/${id}/lib/manifest.json`),
    ]);

    const files = promises.map((promise) => {
      if (!promise.ok) throw new InternalServerErrorException();
      return promise.arrayBuffer();
    });

    const [indexFile, operationsFile, iconFile, manifestFile] = await Promise.all(files);

    return [indexFile, operationsFile, iconFile, manifestFile];
  }

  async install(body: CreatePluginDto) {
    const { id } = body;
    const [index, operations, icon, manifest] = await this.fetchPluginFiles(id);
    return await this.create(body, { index, operations, icon, manifest });
  }

  update(id: string, updatePluginDto: UpdatePluginDto) {
    return `This action updates a #${id} plugin`;
  }

  async remove(id: string) {
    return await this.pluginsRepository.delete(id);
  }
}
