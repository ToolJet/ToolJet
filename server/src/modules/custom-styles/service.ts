import { Injectable } from '@nestjs/common';
import { ICustomStylesService } from './interface/IService';
@Injectable()
export class CustomStylesService implements ICustomStylesService {
  async save(organizationId: string, styles: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async fetch(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
