import { BeforeApplicationShutdown, Module, OnApplicationBootstrap, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppsModule } from './modules/apps/apps.module';
import { FoldersModule } from './modules/folders/folders.module';
import { FolderAppsModule } from './modules/folder_apps/folder_apps.module';
import { DataQueriesModule } from './modules/data_queries/data_queries.module';
import { DataSourcesModule } from './modules/data_sources/data_sources.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { ConfigModule } from '@nestjs/config';
import ormconfig from '../ormconfig';
import { CaslModule } from './modules/casl/casl.module';
import { EmailService } from '@services/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`../.env.${process.env.NODE_ENV}`, '../.env']
    }),
    TypeOrmModule.forRoot(ormconfig),
    AuthModule,
    UsersModule,
    AppsModule,
    FoldersModule,
    FolderAppsModule,
    DataQueriesModule,
    DataSourcesModule,
    OrganizationsModule,
    CaslModule
  ],
  controllers: [AppController],
  providers: [AppService, EmailService],
})
export class AppModule implements OnModuleInit, OnApplicationBootstrap {
  constructor(private connection: Connection) {}

  onModuleInit() {
    console.log(`Initializing ToolJet server modules 📡 `);
  }

  onApplicationBootstrap() {
    console.log(`Initialized ToolJet server, waiting for requests 🚀`);
  }
}
