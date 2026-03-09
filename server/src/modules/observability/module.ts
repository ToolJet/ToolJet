import { DynamicModule, Module } from '@nestjs/common';
import { ObservabilityController } from './controller';
import { ObservabilityService } from './service';

@Module({})
export class ObservabilityModule {
  static register(): DynamicModule {
    return {
      module: ObservabilityModule,
      controllers: [ObservabilityController],
      providers: [ObservabilityService],
    };
  }
}
