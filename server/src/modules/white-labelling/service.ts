import { Injectable } from '@nestjs/common';
import { IWhiteLabellingService } from './Interfaces/IService';
import { UpdateWhiteLabellingDto } from './dto';
import { WhiteLabellingUtilService } from './util.service';
import { User } from '@entities/user.entity';

@Injectable()
export class WhiteLabellingService implements IWhiteLabellingService {
  constructor(protected readonly whiteLabellingUtilService: WhiteLabellingUtilService) {}
  async getProcessedSettings(organizationId: string): Promise<any> {
    return this.whiteLabellingUtilService.getProcessedSettings();
  }

  async updateSettings(updateDto: UpdateWhiteLabellingDto, user: User, organizationId?: string | null): Promise<any> {
    throw new Error('Method not implemented.');
  }
}
