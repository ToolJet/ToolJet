import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class SessionTransferService {
  async createToken(userId: string, organizationId: string, targetOrganizationId?: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async exchangeToken(token: string, response: Response): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
