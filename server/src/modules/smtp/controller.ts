import { Controller, UseGuards } from '@nestjs/common';
import { ListSMTPDto, UpdateSmtpEnvSettingChangedDto, UpdateSMTPSettingsDto, UpdateSmtpStatusChangedDto } from './dto';
import { JwtAuthGuard } from '@modules/session/guards/jwt-auth.guard';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { FeatureAbilityGuard } from './ability/guard';
import { SmtpControllerInterface } from './interfaces/IController';
import { InitFeature } from '@modules/app/decorators/init-feature.decorator';
import { FEATURE_KEY } from './constants';

@InitModule(MODULES.SMTP)
@Controller('smtp')
@UseGuards(JwtAuthGuard, FeatureAbilityGuard)
export class SmtpController implements SmtpControllerInterface {
  constructor() {}

  @InitFeature(FEATURE_KEY.GET)
  getSMTPSettings(): Promise<ListSMTPDto> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE)
  updateSmtpSettings(updateSmtpSettingsDto: UpdateSMTPSettingsDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_ENV)
  updateSmtpEnvSetting(updateSmtpEnvSettingChangedDto: UpdateSmtpEnvSettingChangedDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  @InitFeature(FEATURE_KEY.UPDATE_STATUS)
  updateSmtpEnvStatus(updateSmtpStatusChangedDto: UpdateSmtpStatusChangedDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
