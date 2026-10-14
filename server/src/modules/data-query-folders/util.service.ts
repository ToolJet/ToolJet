import { Injectable } from '@nestjs/common';
import { IDataQueryFoldersUtilService } from './interfaces/IUtilService';

@Injectable()
export class DataQueryFoldersUtilService implements IDataQueryFoldersUtilService {
  async getFoldersWithMappings(_appVersionId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  async getRootMappings(_appVersionId: string): Promise<any[]> {
    throw new Error('Method not implemented.');
  }
}
