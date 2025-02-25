import { Injectable } from '@nestjs/common';
import { IWhiteLabellingService } from './Interfaces/IService';
import { UpdateWhiteLabellingDto } from './dto';

@Injectable()
export class WhiteLabellingService implements IWhiteLabellingService {
  constructor() {}
  async getProcessedSettings(organizationId: string): Promise<any> {
    throw new Error('Method not implemented.');
  }

  async updateSettings(updateDto: UpdateWhiteLabellingDto, organizationId?: string | null): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
