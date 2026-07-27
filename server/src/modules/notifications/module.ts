import { DynamicModule, Module } from '@nestjs/common';
import { SubModule } from '@modules/app/sub-module';
import { NotificationService } from './service';
import { NotificationRepository } from './repository';
import { NotificationController } from './controller';
import { InAppChannel } from './channels/in-app.channel';
import { NOTIFICATION_CHANNELS } from './constants';

@Module({})
export class NotificationsModule extends SubModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }, isMainImport?: boolean): Promise<DynamicModule> {
    const cacheKey = this.buildCacheKey(configs, isMainImport);
    const cached = this.getCachedModule(cacheKey);
    if (cached) return cached;

    return this.cacheModule(cacheKey, {
      module: NotificationsModule,
      // Mount controller only at the main app import; feature modules importing this
      // for NotificationService must not re-register the route.
      controllers: isMainImport ? [NotificationController] : [],
      providers: [
        NotificationService,
        NotificationRepository,
        InAppChannel,
        { provide: NOTIFICATION_CHANNELS, useFactory: (inApp: InAppChannel) => [inApp], inject: [InAppChannel] },
      ],
      exports: [NotificationService],
    });
  }
}
