import { Response } from 'express';

export interface IFilesController {
  show(id: string, response: Response): Promise<any>;
}
