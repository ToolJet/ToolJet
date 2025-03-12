import { DynamicModule, Type } from '@nestjs/common';
import { getImportPath } from './constants';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { getEnvVars } from '../../../scripts/database-config-utils';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../../../ormconfig';
import { RequestContextModule } from '@modules/request-context/module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GuardValidatorModule } from './validators/feature-guard.validator';
import { SentryModule } from '@modules/observability/sentry/module';

export class AppModuleLoader {
  static async loadModules(configs: { IS_GET_CONTEXT: boolean }): Promise<(DynamicModule | Type<any>)[]> {
    // Static imports that are always loaded
    const staticModules = [
      EventEmitterModule.forRoot({
        wildcard: false,
        newListener: false,
        removeListener: false,
        maxListeners: 5,
        verboseMemoryLeak: true,
        ignoreErrors: false,
      }),
      ScheduleModule.forRoot(),
      BullModule.forRoot({
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
        },
      }),
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`../.env.${process.env.NODE_ENV}`, '../.env'],
        load: [() => getEnvVars()],
      }),
      LoggerModule.forRoot({
        pinoHttp: {
          level: (() => {
            const logLevel = {
              production: 'info',
              development: 'debug',
              test: 'error',
            };
            return logLevel[process.env.NODE_ENV] || 'info';
          })(),
          autoLogging: {
            ignorePaths: ['/api/health'],
          },
          prettyPrint:
            process.env.NODE_ENV !== 'production'
              ? {
                  colorize: true,
                  levelFirst: true,
                  translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z',
                }
              : false,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers.authorization',
              'res.headers["set-cookie"]',
              'req.headers["proxy-authorization"]',
              'req.headers["www-authenticate"]',
              'req.headers["authentication-info"]',
              'req.headers["x-forwarded-for"]',
              ...(process.env.LOGGER_REDACT ? process.env.LOGGER_REDACT?.split(',') : []),
            ],
            censor: '[REDACTED]',
          },
        },
      }),
      TypeOrmModule.forRoot(ormconfig),
      TypeOrmModule.forRoot(tooljetDbOrmconfig),
      RequestContextModule,
      GuardValidatorModule,
    ];

    if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
      staticModules.unshift(
        ServeStaticModule.forRoot({
          // Have to remove trailing slash of SUB_PATH.
          serveRoot: process.env.SUB_PATH === undefined ? '' : process.env.SUB_PATH.replace(/\/$/, ''),
          rootPath: join(__dirname, '../../../../../', 'frontend/build'),
        })
      );
    }

    if (process.env.APM_VENDOR == 'sentry') {
      staticModules.unshift(
        SentryModule.forRoot({
          dsn: process.env.SENTRY_DNS,
          tracesSampleRate: 1.0,
          debug: !!process.env.SENTRY_DEBUG,
        })
      );
    }

    /**
     * ███████████████████████████████████████████████████████████████████████████████
     * █                                                                             █
     * █                            DYNAMIC MODULES                                  █
     * █                                                                             █
     * █     Modules added here can be easily enabled with minimal code changes.     █
     * █     Not keeping the code on base directories.                               █
     * █                                                                             █
     * ███████████████████████████████████████████████████████████████████████████████
     */
    const dynamicModules: DynamicModule[] = [];

    try {
      const { LogToFileModule } = await import(`${await getImportPath(configs.IS_GET_CONTEXT)}/log-to-file/module`);
      const { AuditLogsModule } = await import(`${await getImportPath(configs.IS_GET_CONTEXT)}/audit-logs/module`);
      dynamicModules.push(await LogToFileModule.register(configs));
      dynamicModules.push(await AuditLogsModule.register(configs));
    } catch (error) {
      console.error('Error loading dynamic modules:', error);
    }

    return [...staticModules, ...dynamicModules];
  }
}
