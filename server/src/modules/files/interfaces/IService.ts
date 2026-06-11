import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';

export interface IFilesService {
  getOne(id: string, response: Response): Promise<StreamableFile>;
}
