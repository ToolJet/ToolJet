import { Injectable } from '@nestjs/common';
import { IDataQueryFoldersService } from './interfaces/IService';
import { BatchReorderDto, CreateFolderDto, DeleteFolderDto, RenameFolderDto, ReorderDto } from './dto';

@Injectable()
export class DataQueryFoldersService implements IDataQueryFoldersService {
  async createFolder(_dto: CreateFolderDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async renameFolder(_id: string, _dto: RenameFolderDto): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async deleteFolder(_id: string, _dto: DeleteFolderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async reorder(_dto: ReorderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async batchReorder(_dto: BatchReorderDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getFolders(_appVersionId: string): Promise<any> {
    return { folders: [], folderMappings: [] };
  }
}
