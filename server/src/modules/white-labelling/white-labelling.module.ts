import { Module } from '@nestjs/common';
import { WhiteLabellingController } from '@controllers/white_labelling.controller';
import { InstanceSettingsModule } from '../instance_settings/instance_settings.module';
import { WhiteLabellingService } from '@services/white_labelling.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhiteLabelling } from 'src/entities/white_labelling.entity';

@Module({
  controllers: [WhiteLabellingController],
  imports: [InstanceSettingsModule, TypeOrmModule.forFeature([WhiteLabelling])],
  providers: [WhiteLabellingService],
  exports: [WhiteLabellingService],
})
export class WhiteLabellingModule {}
