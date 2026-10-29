import { CreatePluginDto, UpdatePluginDto } from '../dto';
import { EntityManager } from 'typeorm';

export interface IPluginsUtilService {
  create(
    createPluginDto: CreatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    },
    specFiles?: Record<string, string>
  ): Promise<any>;

  fetchPluginFiles(
    id: string,
    repo: string
  ): Promise<[ArrayBuffer, ArrayBuffer, ArrayBuffer, ArrayBuffer, string] | unknown>;

  fetchPluginFilesFromRepo(repo: string): Promise<any[]>;

  upgrade(
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
  ): Promise<any>;

  updateSpecFilesForReload(
    currentMap: Record<string, string> | null,
    newSpecFiles: Record<string, string> | undefined,
    manager: EntityManager
  ): Promise<Record<string, string> | null>;
}
