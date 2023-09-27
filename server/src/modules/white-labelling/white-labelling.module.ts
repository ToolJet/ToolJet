import { Module } from '@nestjs/common';
import { WhiteLabellingController } from '@controllers/white_labelling.controller';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';
@Module({
  controllers: [WhiteLabellingController],
  imports: [InstanceSettingsModule],
})
export class WhiteLabellingModule {}
