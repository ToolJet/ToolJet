import { Module, OnModuleInit, RequestMethod, MiddlewareConsumer } from '@nestjs/common';

import { Connection } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import ormconfig from '../ormconfig';
import { SeedsModule } from './modules/seeds/seeds.module';
import { SeedsService } from '@services/seeds.service';

import { LoggerModule } from 'nestjs-pino';
import { SentryModule } from './modules/observability/sentry/sentry.module';
import * as Sentry from '@sentry/node';

import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
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
import { join } from 'path';
import { LibraryAppModule } from './modules/library_app/library_app.module';
import { ThreadModule } from './modules/thread/thread.module';
import { EventsModule } from './events/events.module';
import { GroupPermissionsModule } from './modules/group_permissions/group_permissions.module';
import * as path from 'path';
import * as fs from 'fs';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`../.env.${process.env.NODE_ENV}`, '../.env'],
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
  AppConfigModule,
  SeedsModule,
  AuthModule,
  UsersModule,
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
  GroupPermissionsModule,
  FilesModule,
  EventsModule,
];

if (process.env.SERVE_CLIENT !== 'false') {
  const filesToReplaceAssetPath = ['index.html', 'runtime.js', 'main.js'];

  for (const fileName of filesToReplaceAssetPath) {
    const file = join(__dirname, '../../../', 'frontend/build', fileName);

    let newValue = process.env.SUB_PATH;

    if (process.env.SUB_PATH === undefined) {
      newValue = fileName === 'index.html' ? '/' : '';
    }

    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        return console.log(err);
      }
      const result = data
        .replace(/__REPLACE_SUB_PATH__\/api/g, path.join(newValue, '/api'))
        .replace(/__REPLACE_SUB_PATH__/g, newValue);
      fs.writeFile(file, result, 'utf8', function (err) {
        if (err) return console.log(err);
      });
    });
  }

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
  providers: [EmailService, SeedsService],
})
export class AppModule implements OnModuleInit {
  constructor(private connection: Connection) {}

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
