import { Injectable } from '@nestjs/common';
import { DEFAULT_WHITE_LABELLING_SETTINGS } from '@modules/white-labelling/constant';
import { IWhiteLabellingUtilService } from './Interfaces/IUtilService';

@Injectable()
export class WhiteLabellingUtilService implements IWhiteLabellingUtilService {
  async getProcessedSettings(organizationId?: string, edition?: string): Promise<any> {
    return {
      ...DEFAULT_WHITE_LABELLING_SETTINGS,
      is_default: true,
    };
  }
}
