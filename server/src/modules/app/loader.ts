import { DynamicModule } from '@nestjs/common';
import { getImportPath } from './constants';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { getEnvVars } from '../../../scripts/database-config-utils';
import { LoggerModule } from 'nestjs-pino';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../../../ormconfig';
import { RequestContextModule } from '@modules/request-context/module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GuardValidatorModule } from './validators/feature-guard.validator';
import { LoggingModule } from '@modules/logging/module';
import { TypeormLoggerService } from '@modules/logging/services/typeorm-logger.service';
import { OpenTelemetryModule } from 'nestjs-otel';
import { SentryModule } from '@sentry/nestjs/setup';
import { RedisModule } from '@modules/redis/module';

export class AppModuleLoader {
  static async loadModules(configs: {
    IS_GET_CONTEXT: boolean;
  }): Promise<(DynamicModule | typeof GuardValidatorModule)[]> {
    const isTest = process.env.NODE_ENV === 'test';
    const mainDbTestOverrides = isTest ? { retryAttempts: 0 } : {};

    const getMainDBConnectionModule = (): DynamicModule => {
      return process.env.DISABLE_CUSTOM_QUERY_LOGGING !== 'true'
        ? TypeOrmModule.forRootAsync({
            inject: [TypeormLoggerService],
            useFactory: (profilerLogger: TypeormLoggerService) => ({
              ...ormconfig,
              ...mainDbTestOverrides,
              logger: profilerLogger,
            }),
          })
        : TypeOrmModule.forRoot({ ...ormconfig, ...mainDbTestOverrides });
    };

    // Static imports that are always loaded
    const staticModules = [
      EventEmitterModule.forRoot({
        wildcard: false,
        newListener: false,
        removeListener: false,
        maxListeners: isTest ? 20 : 5,
        verboseMemoryLeak: true,
        ignoreErrors: false,
      }),
      // ScheduleModule registers cron timers that accumulate across test files.
      // Excluding it in test mode makes @Cron decorators inert (no timers fire).
      ...(isTest ? [] : [ScheduleModule.forRoot()]),
      BullModule.forRoot({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          ...(process.env.REDIS_USERNAME && { username: process.env.REDIS_USERNAME }),
          ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
          ...(process.env.REDIS_DB && { db: parseInt(process.env.REDIS_DB) }),
          ...(process.env.REDIS_TLS === 'true' && { tls: {} }),
          // In test mode: disable ioredis reconnection to prevent zombie connections
          // accumulating across test files in a long-lived Node.js process.
          // lazyConnect defers the TCP connection until a command is actually sent,
          // preventing open handles when unit tests don't use BullMQ queues.
          ...(isTest && {
            maxRetriesPerRequest: null,
            retryStrategy: () => null,
            lazyConnect: true,
          }),
        },
      }),
      await ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: [`../.env.${process.env.NODE_ENV}`, '../.env'],
        load: [() => getEnvVars()],
      }),
      LoggerModule.forRoot({
        pinoHttp: {
          level: (() => {
            // Allow explicit OTEL_LOG_LEVEL override only when OTEL is enabled
            if (process.env.OTEL_LOG_LEVEL && process.env.ENABLE_OTEL === 'true') {
              return process.env.OTEL_LOG_LEVEL;
            }
            const logLevel = {
              production: 'info',
              development: 'debug',
              test: 'silent',
            };
            return logLevel[process.env.NODE_ENV] || 'info';
          })(),
          autoLogging: process.env.NODE_ENV === 'test' ? false : {
            ignore: (req) => {
              if (req.url === '/api/health' || req.url === '/api/metrics') {
                return true;
              }
              return false;
            },
          },
          transport:
            process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'UTC:mm/dd/yyyy, h:MM:ss TT Z',
                  },
                }
              : undefined,
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
          customProps: (req, res) => {
            const id = res?.['locals']?.tj_transactionId;
            return id ? { transactionId: id } : {};
          },
        },
      }),
      getMainDBConnectionModule(),
      TypeOrmModule.forRoot({
        ...tooljetDbOrmconfig,
        ...(process.env.NODE_ENV === 'test' && { retryAttempts: 0 }),
      }),
      RequestContextModule,
      GuardValidatorModule,
      LoggingModule.forRoot(),
      RedisModule.forRoot(),
    ];

    // Add OpenTelemetry Module if enabled
    if (process.env.ENABLE_OTEL === 'true') {
      staticModules.push(
        OpenTelemetryModule.forRoot({
          metrics: {
            hostMetrics: true,
          },
        })
      );
    }

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
      staticModules.unshift(SentryModule.forRoot());
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

    if (!configs.IS_GET_CONTEXT) {
      // Load dynamic modules only when not in migration context
      try {
        if (process.env.LOG_FILE_PATH) {
          // Add log-to-file module if LOG_FILE_PATH is set
          const { LogToFileModule } = await import(`${await getImportPath(configs.IS_GET_CONTEXT)}/log-to-file/module`);
          dynamicModules.push(await LogToFileModule.register(configs));
        }

        const { AuditLogsModule } = await import(`${await getImportPath(configs.IS_GET_CONTEXT)}/audit-logs/module`);
        dynamicModules.push(await AuditLogsModule.register(configs));
      } catch (error) {
        console.error('Error loading dynamic modules:', error);
      }
    }

    return [...staticModules, ...dynamicModules];
  }
}
