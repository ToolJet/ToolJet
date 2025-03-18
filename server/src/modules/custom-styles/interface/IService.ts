import { InsertResult } from 'typeorm';

export interface ICustomStylesService {
  save(organizationId: string, styles: string): Promise<InsertResult>;
  fetch(organizationId: string): Promise<{
    organizationId?: string;
    styles: string;
    css?: string;
  }>;
}
