import { Module, OnModuleInit, RequestMethod, MiddlewareConsumer } from '@nestjs/common';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormconfig, tooljetDbOrmconfig } from '../ormconfig';
import { getEnvVars } from '../scripts/database-config-utils';

import { SeedsModule } from './modules/seeds/seeds.module';
import { SeedsService } from '@services/seeds.service';

import { LoggerModule } from 'nestjs-pino';
import { SentryModule } from './modules/observability/sentry/sentry.module';
import * as Sentry from '@sentry/node';

import { ConfigModule } from '@nestjs/config';
import { CaslModule } from './modules/casl/casl.module';
import { EmailService } from '@services/email.service';
import { MetaModule } from './modules/meta/meta.module';
import { AppController } from './controllers/app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FilesModule } from './modules/files/files.module';
import { AppConfigModule } from './modules/app_config/app_config.module';
import { AppsModule } from './modules/apps/apps.module';
import { FoldersModule } from './modules/folders/folders.module';
import { OrgEnvironmentVariablesModule } from './modules/org_environment_variables/org_environment_variables.module';
import { FolderAppsModule } from './modules/folder_apps/folder_apps.module';
import { DataQueriesModule } from './modules/data_queries/data_queries.module';
import { DataSourcesModule } from './modules/data_sources/data_sources.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CommentModule } from './modules/comments/comment.module';
import { CommentUsersModule } from './modules/comment_users/comment_users.module';
import { LibraryAppModule } from './modules/library_app/library_app.module';
import { ThreadModule } from './modules/thread/thread.module';
import { EventsModule } from './events/events.module';
import { TooljetDbModule } from './modules/tooljet_db/tooljet_db.module';
import { PluginsModule } from './modules/plugins/plugins.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { AppEnvironmentsModule } from './modules/app_environments/app_environments.module';
import { OrganizationConstantModule } from './modules/organization_constants/organization_constants.module';
import { RequestContextModule } from './modules/request_context/request-context.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ImportExportResourcesModule } from './modules/import_export_resources/import_export_resources.module';
import { UserResourcePermissionsModule } from '@modules/user_resource_permissions/user_resource_permissions.module';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { GetConnection } from '@modules/database/getConnection';
import { InstanceSettingsModule } from '@instance-settings/module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LicenseModule } from '@licensing/module';
import { OpenTelemetryModule } from 'nestjs-otel';

const imports = [
  EventEmitterModule.forRoot({
    wildcard: false,
    newListener: false,
    removeListener: false,
    maxListeners: 5,
    verboseMemoryLeak: true,
    ignoreErrors: false,
  }),
  ScheduleModule.forRoot(),
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
      redact: ['req.headers.authorization'],
    },
  }),
  TypeOrmModule.forRoot(ormconfig),
  TypeOrmModule.forRoot(tooljetDbOrmconfig),
  OpenTelemetryModule.forRoot({
    metrics: {
      hostMetrics: true,
      apiMetrics: {
        enable: true,
        defaultAttributes: {
          custom: 'metrics',
        },
        ignoreRoutes: ['/favicon.ico', '/api/health'], // You can ignore specific routes (See https://docs.nestjs.com/middleware#excluding-routes for options)
        ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
      },
    },
  }),
  RequestContextModule,
  InstanceSettingsModule,
  AppConfigModule,
  SeedsModule,
  AuthModule,
  UsersModule,
  LicenseModule,
  AppsModule,
  FoldersModule,
  OrgEnvironmentVariablesModule,
  FolderAppsModule,
  DataQueriesModule,
  DataSourcesModule,
  OrganizationsModule,
  CaslModule,
  MetaModule,
  LibraryAppModule,
  UserResourcePermissionsModule,
  PermissionsModule,
  FilesModule,
  PluginsModule,
  EventsModule,
  AppEnvironmentsModule,
  ImportExportResourcesModule,
  CopilotModule,
  OrganizationConstantModule,
  TooljetDbModule,
];

if (process.env.SERVE_CLIENT !== 'false' && process.env.NODE_ENV === 'production') {
  imports.unshift(
    ServeStaticModule.forRoot({
      // Have to remove trailing slash of SUB_PATH.
      serveRoot: process.env.SUB_PATH === undefined ? '' : process.env.SUB_PATH.replace(/\/$/, ''),
      rootPath: join(__dirname, '../../../', 'frontend/build'),
    })
  );
}

if (process.env.APM_VENDOR == 'sentry') {
  imports.unshift(
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: !!process.env.SENTRY_DEBUG,
    })
  );
}

if (process.env.COMMENT_FEATURE_ENABLE !== 'false') {
  imports.unshift(CommentModule, ThreadModule, CommentUsersModule);
}

@Module({
  imports,
  controllers: [AppController],
  providers: [EmailService, SeedsService, GetConnection],
})
export class AppModule implements OnModuleInit {
  constructor() {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }

  onModuleInit(): void {
    console.log(`Version: ${globalThis.TOOLJET_VERSION}`);
    console.log(`Initializing server modules 📡 `);
  }
}
