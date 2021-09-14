import {
  Module,
  OnApplicationBootstrap,
  OnModuleInit,
  RequestMethod,
  MiddlewareConsumer,
} from '@nestjs/common';

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
import { AppService } from './services/app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AppConfigModule } from './modules/app_config/app_config.module'
import { AppsModule } from './modules/apps/apps.module';
import { FoldersModule } from './modules/folders/folders.module';
import { FolderAppsModule } from './modules/folder_apps/folder_apps.module';
import { DataQueriesModule } from './modules/data_queries/data_queries.module';
import { DataSourcesModule } from './modules/data_sources/data_sources.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { join } from 'path';

const imports = [
  ConfigModule.forRoot({
    isGlobal: true,
    envFilePath: [`../.env.${process.env.NODE_ENV}`, '../.env'],
  }),
  LoggerModule.forRoot({
    pinoHttp: {
      level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
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
  FolderAppsModule,
  DataQueriesModule,
  DataSourcesModule,
  OrganizationsModule,
  CaslModule,
  MetaModule,
];

if (process.env.SERVE_CLIENT !== 'false') {
  imports.unshift(
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../../../', 'frontend/build'),
    }),
  );
}

if (process.env.APM_VENDOR == 'sentry') {
  imports.unshift(
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DNS,
      tracesSampleRate: 1.0,
      debug: !!process.env.SENTRY_DEBUG,
    }),
  );
}

@Module({
  imports,
  controllers: [AppController],
  providers: [AppService, EmailService, SeedsService],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
  constructor(private connection: Connection) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }

  onModuleInit() {
    console.log(`Initializing ToolJet server modules 📡 `);
  }

  onApplicationBootstrap() {
    console.log(`Initialized ToolJet server, waiting for requests 🚀`);
  }
}
