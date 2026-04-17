import { EntityManager } from 'typeorm';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping } from '@entities/data_query_folder_mapping.entity';

export interface IDataQueryFoldersUtilService {
  getFoldersWithMappings(appVersionId: string, manager?: EntityManager): Promise<DataQueryFolder[]>;
  getRootMappings(appVersionId: string, manager?: EntityManager): Promise<DataQueryFolderMapping[]>;
}
