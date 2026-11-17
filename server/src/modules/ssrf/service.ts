import { Injectable } from '@nestjs/common';
import { SsrfSettingsResponseDto, UpdateSsrfSettingsDto } from './dto';
import { ISsrfService } from './Interfaces/IService';

/** CE stub: the settings page is EE only. The controller answers 404 before reaching this. */
@Injectable()
export class SsrfService implements ISsrfService {
  getSettings(): Promise<SsrfSettingsResponseDto> {
    throw new Error('Method not implemented.');
  }
  updateSettings(params: UpdateSsrfSettingsDto): Promise<SsrfSettingsResponseDto> {
    throw new Error('Method not implemented.');
  }
  dismissUpgradeNotice(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
