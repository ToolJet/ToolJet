import { dbTransactionWrap } from '@helpers/database.helper';
import { CreatePluginDto, UpdatePluginDto } from './dto';
import { EntityManager } from 'typeorm';
import { FilesRepository } from '@modules/files/repository';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Plugin } from '@entities/plugin.entity';
import { encode } from 'js-base64';
import { File } from 'src/entities/file.entity';
import * as fs from 'fs';
import { CreateFileDto, UpdateFileDto } from '@modules/files/dto';
import { IPluginsUtilService } from './interfaces/IUtilService';
import { Injectable } from '@nestjs/common';

/**
 * Extracts @spec/ references from operations.json content to discover spec file names.
 * Handles both string specUrl ("@spec/kind/name") and object specUrl ({ "Label": "@spec/kind/name" }).
 */
function extractSpecNamesFromOperations(operationsContent: string): string[] {
  try {
    const ops = JSON.parse(operationsContent);
    const specNames: string[] = [];

    function findSpecUrls(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'specUrl' || key === 'spec_url') {
          if (typeof value === 'string' && value.startsWith('@spec/')) {
            const parts = value.slice('@spec/'.length).split('/');
            if (parts.length === 2) specNames.push(parts[1]);
          } else if (typeof value === 'object') {
            for (const v of Object.values(value)) {
              if (typeof v === 'string' && v.startsWith('@spec/')) {
                const parts = v.slice('@spec/'.length).split('/');
                if (parts.length === 2) specNames.push(parts[1]);
              }
            }
          }
        }
        if (typeof value === 'object') findSpecUrls(value);
      }
    }

    findSpecUrls(ops);
    return [...new Set(specNames)];
  } catch {
    return [];
  }
}

@Injectable()
export class PluginsUtilService implements IPluginsUtilService {
  constructor(
    protected readonly filesRepository: FilesRepository,
    protected readonly configService: ConfigService
  ) {}

  async create(
    createPluginDto: CreatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    },
    specFiles?: Record<string, string>
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
        await Promise.all(
          Object.keys(files).map(async (key) => {
            return await dbTransactionWrap(async (manager: EntityManager) => {
              const file = files[key];
              const fileDto = new CreateFileDto();
              fileDto.data = encode(file);
              fileDto.filename = key;
              uploadedFiles[key] = await this.filesRepository.createOne(fileDto, manager);
            });
          })
        );

        // Store OpenAPI spec files from openapi-specs/ directory if present.
        // Naming convention: filename minus extension = key everywhere.
        //   openapi-specs/accounting.yaml → spec_files_map: { "accounting": fileId }
        //   Resolved in operations.json as: @spec/<pluginKind>/accounting
        // TODO: Plugin file cleanup — uninstalling a plugin does not delete associated
        // File entities (index, operations, icon, manifest, specs). This is pre-existing
        // tech debt across all plugin files, not specific to spec files.
        const specFilesMap = await this.storeSpecFiles(specFiles, manager);

        const plugin = new Plugin();
        plugin.pluginId = createPluginDto.id;
        plugin.name = createPluginDto.name;
        plugin.repo = createPluginDto.repo || '';
        plugin.version = version || createPluginDto.version;
        plugin.description = createPluginDto.description;
        plugin.indexFileId = uploadedFiles.index.id;
        plugin.operationsFileId = uploadedFiles.operations.id;
        plugin.iconFileId = uploadedFiles.icon.id;
        plugin.manifestFileId = uploadedFiles.manifest.id;
        plugin.specFilesMap = specFilesMap;

        return await manager.save(plugin);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        await queryRunner.release();
      }
    });
  }

  fetchPluginFiles(id: string, repo: string) {
    // id is interpolated into S3 URLs and local paths
    if (!/^[A-Za-z0-9_-]+$/.test(id ?? '')) throw new BadRequestException('Invalid plugin id');

    // Plugins are only fetched from the ToolJet marketplace, never from user-supplied repos
    return this.fetchPluginFilesFromS3(id);
  }

  private async fetchPluginFilesFromS3(id: string): Promise<any> {
    if (process.env.NODE_ENV === 'production') {
      const host = this.configService.get<string>(
        'TOOLJET_MARKETPLACE_URL',
        'https://tooljet-plugins-production.s3.us-east-2.amazonaws.com'
      );

      const promises = await Promise.all([
        fetch(`${host}/marketplace-assets/${id}/dist/index.js`),
        fetch(`${host}/marketplace-assets/${id}/lib/operations.json`),
        fetch(`${host}/marketplace-assets/${id}/lib/icon.svg`),
        fetch(`${host}/marketplace-assets/${id}/lib/manifest.json`),
      ]);

      const files = promises.map(async (promise) => {
        if (!promise.ok) throw new InternalServerErrorException();
        const arrayBuffer = await promise.arrayBuffer();
        const textDecoder = new TextDecoder();
        return textDecoder.decode(arrayBuffer);
      });

      const [indexFile, operationsFile, iconFile, manifestFile] = await Promise.all(files);

      // Discover and fetch OpenAPI spec files referenced in operations.json
      const specFiles: Record<string, string> = {};
      const specNames = extractSpecNamesFromOperations(operationsFile);
      if (specNames.length > 0) {
        const specPromises = specNames.map(async (specName) => {
          // Try .yaml first, fall back to .json
          for (const ext of ['yaml', 'json']) {
            const specResponse = await fetch(`${host}/marketplace-assets/${id}/openapi-specs/${specName}.${ext}`);
            if (specResponse.ok) {
              specFiles[specName] = await specResponse.text();
              return;
            }
          }
        });
        await Promise.all(specPromises);
      }

      return [indexFile, operationsFile, iconFile, manifestFile, undefined, specFiles];
    }

    async function readFile(filePath) {
      return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        let fileContent = '';

        readStream.on('data', (chunk) => {
          fileContent += chunk;
        });

        readStream.on('error', (err) => {
          reject(err);
        });

        readStream.on('end', () => {
          resolve(fileContent);
        });
      });
    }

    const [indexFile, operationsFile, iconFile, manifestFile] = await Promise.all([
      readFile(`../marketplace/plugins/${id}/dist/index.js`),
      readFile(`../marketplace/plugins/${id}/lib/operations.json`),
      readFile(`../marketplace/plugins/${id}/lib/icon.svg`),
      readFile(`../marketplace/plugins/${id}/lib/manifest.json`),
    ]);

    // Read OpenAPI spec files from openapi-specs/ directory if it exists
    const specFiles: Record<string, string> = {};
    const specsDir = `../marketplace/plugins/${id}/openapi-specs`;
    if (fs.existsSync(specsDir)) {
      const specFileNames = fs.readdirSync(specsDir).filter((f: string) => f.endsWith('.yaml') || f.endsWith('.json'));
      await Promise.all(
        specFileNames.map(async (fileName: string) => {
          const specName = fileName.replace(/\.(yaml|json)$/, '');
          specFiles[specName] = (await readFile(`${specsDir}/${fileName}`)) as string;
        })
      );
    }

    return [indexFile, operationsFile, iconFile, manifestFile, undefined, specFiles];
  }

  async upgrade(
    id: string,
    updatePluginDto: UpdatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    },
    specFiles?: Record<string, string>
  ) {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const queryRunner = manager.connection.createQueryRunner();

      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const currentPlugin = await manager.findOne(Plugin, {
          where: { id },
        });

        const uploadedFiles: { index?: File; operations?: File; icon?: File; manifest?: File } = {};
        await Promise.all(
          Object.keys(files).map(async (key) => {
            return await dbTransactionWrap(async (manager: EntityManager) => {
              const file = files[key];
              const fileDto = new UpdateFileDto();
              fileDto.data = encode(file);
              fileDto.filename = key;
              uploadedFiles[key] = await this.filesRepository.updateOne(
                currentPlugin[`${key}FileId`],
                fileDto,
                manager
              );
            });
          })
        );

        // Update spec files: update existing, create new, remove stale
        const specFilesMap = await this.updateSpecFilesForReload(currentPlugin.specFilesMap, specFiles, manager);

        const plugin = new Plugin();
        plugin.id = currentPlugin.id;
        plugin.repo = updatePluginDto.repo || '';
        plugin.version = version ?? updatePluginDto.version;
        plugin.specFilesMap = specFilesMap;

        return manager.save(plugin);
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(error);
      } finally {
        await queryRunner.release();
      }
    });
  }

  /**
   * Store new spec files in the DB. Returns the spec_files_map or null.
   */
  private async storeSpecFiles(
    specFiles: Record<string, string> | undefined,
    manager: EntityManager
  ): Promise<Record<string, string> | null> {
    if (!specFiles || Object.keys(specFiles).length === 0) return null;

    const specFilesMap: Record<string, string> = {};
    await Promise.all(
      Object.entries(specFiles).map(async ([specName, specContent]) => {
        const fileDto = new CreateFileDto();
        fileDto.data = encode(specContent);
        fileDto.filename = specName;
        const savedFile = await this.filesRepository.createOne(fileDto, manager);
        specFilesMap[specName] = savedFile.id;
      })
    );
    return specFilesMap;
  }

  /**
   * Update spec files during plugin upgrade/reload.
   * - Updates existing specs in place
   * - Creates new specs that didn't exist before
   * - Removes stale specs no longer in the source
   */
  async updateSpecFilesForReload(
    currentMap: Record<string, string> | null,
    newSpecFiles: Record<string, string> | undefined,
    manager: EntityManager
  ): Promise<Record<string, string> | null> {
    if (!newSpecFiles || Object.keys(newSpecFiles).length === 0) {
      // No specs in new version — clear the map (stale File entities remain as tech debt)
      return null;
    }

    const updatedMap: Record<string, string> = {};
    const existingMap = currentMap || {};

    await Promise.all(
      Object.entries(newSpecFiles).map(async ([specName, specContent]) => {
        if (existingMap[specName]) {
          // Update existing file in place
          const fileDto = new UpdateFileDto();
          fileDto.data = encode(specContent);
          fileDto.filename = specName;
          await this.filesRepository.updateOne(existingMap[specName], fileDto, manager);
          updatedMap[specName] = existingMap[specName];
        } else {
          // Create new file
          const fileDto = new CreateFileDto();
          fileDto.data = encode(specContent);
          fileDto.filename = specName;
          const savedFile = await this.filesRepository.createOne(fileDto, manager);
          updatedMap[specName] = savedFile.id;
        }
      })
    );

    // Stale specs (in currentMap but not in newSpecFiles) are left as orphan File entities.
    // TODO: Delete stale spec files as part of the broader plugin file cleanup effort.

    return updatedMap;
  }
}
