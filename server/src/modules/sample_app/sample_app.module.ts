import { Module } from '@nestjs/common';
import { SampleAppController } from '@controllers/sample_app.controller';
import { SampleAppCreationService } from '@services/sample_app_creation.service';

@Module({
  imports: [],
  providers: [SampleAppCreationService],
  controllers: [SampleAppController],
})

export class SampleAppModule {}
