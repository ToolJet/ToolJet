import { Module } from '@nestjs/common';
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
import { typeOrmConfigAsync } from './config/typeorm.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    AuthModule,
    UsersModule,
    AppsModule,
    FoldersModule,
    FolderAppsModule,
    DataQueriesModule,
    DataSourcesModule,
    OrganizationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private connection: Connection) {}
}
