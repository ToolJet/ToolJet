import { CreatePluginDto, UpdatePluginDto } from '../dto';

export interface IPluginsUtilService {
  create(
    createPluginDto: CreatePluginDto,
    version: string,
    files: {
      index: ArrayBuffer;
      operations: ArrayBuffer;
      icon: ArrayBuffer;
      manifest: ArrayBuffer;
    }
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
    }
  ): Promise<any>;
}
