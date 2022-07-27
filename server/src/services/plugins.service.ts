import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from 'src/entities/file.entity';
import { Plugin } from 'src/entities/plugin.entity';
import { Repository, Connection } from 'typeorm';
import { CreateFileDto } from '../dto/create-file.dto';
// import { CreatePluginDto } from '../dto/create-plugin.dto';
import { UpdatePluginDto } from '../dto/update-plugin.dto';
import { FilesService } from './files.service';
import { encode } from 'js-base64';
import * as jszip from 'jszip';

const jszipInstance = new jszip();

@Injectable()
export class PluginsService {
  constructor(
    private readonly filesService: FilesService,
    private connection: Connection,
    @InjectRepository(Plugin)
    private pluginsRepository: Repository<Plugin>
  ) {}
  async create(
    createPluginDto: any,
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
          // const file = files[key].pop();
          // const str = file.buffer.toString('utf8');
          const fileDto = new CreateFileDto();
          fileDto.data = encode(file);
          fileDto.filename = key;
          uploadedFiles[key] = await this.filesService.create(fileDto, queryRunner);
        })
      );

      const plugin = new Plugin();
      plugin.name = createPluginDto.name;
      plugin.version = createPluginDto.version;
      plugin.repo = createPluginDto.repo;
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

  async fetchPluginFiles(repo: string) {
    const releaseResponse = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    const latestRelease = await releaseResponse.json();
    const [zipballResponse, indexResponse] = await Promise.all([
      fetch(`${latestRelease.zipball_url}`),
      fetch(`${latestRelease.assets[0].browser_download_url}`),
    ]);
    const zipball = await zipballResponse.arrayBuffer();
    const index = await indexResponse.arrayBuffer();

    const result = await jszipInstance.loadAsync(zipball);

    let manifestFileKey: string;
    let iconFileKey: string;
    let operationsFileKey: string;

    Object.keys(result.files).forEach(async (key) => {
      if (key.includes('manifest.json')) {
        manifestFileKey = key;
      } else if (key.includes('icon.svg')) {
        iconFileKey = key;
      } else if (key.includes('operations.json')) {
        operationsFileKey = key;
      }
    });

    const [manifestFile, iconFile, operations] = await Promise.all([
      result.files[manifestFileKey].async('arraybuffer'),
      result.files[iconFileKey].async('arraybuffer'),
      result.files[operationsFileKey].async('arraybuffer'),
    ]);

    const version = latestRelease.name.replace('v', '');

    return [index, operations, manifestFile, iconFile, version];
  }

  async install(body: any) {
    const { name, repo, description } = body;
    const [index, operations, manifest, icon, version] = await this.fetchPluginFiles(repo);
    await this.create({ name, version, repo, description }, { index, operations, icon, manifest });
  }

  update(id: string, updatePluginDto: UpdatePluginDto) {
    return `This action updates a #${id} plugin`;
  }

  remove(id: string) {
    return `This action removes a #${id} plugin`;
  }
}
