import { DynamicModule } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { SubModule } from '@modules/app/sub-module';
import { ValidationWarningsInterceptor } from './warnings.interceptor';

export class AppValidationModule extends SubModule {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const { AppValidationService } = await this.getProviders(configs, 'app-validation', ['service']);

    return {
      module: AppValidationModule,
      global: true,
      providers: [AppValidationService, { provide: APP_INTERCEPTOR, useClass: ValidationWarningsInterceptor }],
      exports: [AppValidationService],
    };
  }
}
