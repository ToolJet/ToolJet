import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppsModule } from './apps/apps.module';
import { FoldersModule } from './folders/folders.module';
import { FolderAppsModule } from './folder_apps/folder_apps.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT) || 5432,
      username: process.env.PG_USER,
      password: process.env.PG_PASS,
      database: process.env.PG_DB,
      autoLoadEntities: true,
      synchronize: false,
      logging: true
    }),
    AuthModule,
    UsersModule,
    AppsModule,
    FoldersModule,
    FolderAppsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {
  constructor(private connection: Connection) {}
}