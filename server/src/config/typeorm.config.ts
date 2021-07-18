import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';

export default class TypeOrmConfig {
  static getOrmConfig(configService: ConfigService): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      database: configService.get<string>('TYPEORM_DATABASE'),
      port: +configService.get<number>('TYPEORM_PORT') || 5432,
      username: configService.get<string>('TYPEORM_USERNAME'),
      password: configService.get<string>('TYPEORM_PASSWORD'),
      host: configService.get<string>('TYPEORM_HOST'),
      synchronize: false,
      migrationsRun: false,
      logging: configService.get<LoggerOptions>('TYPEORM_LOGGING') || 'all',
      entities: [configService.get<string>('TYPEORM_ENTITIES')],
      migrations: [configService.get<string>('TYPEORM_MIGRATIONS')],
      cli: {
        migrationsDir: configService.get<string>('TYPEORM_MIGRATIONS_DIR'),
      },
    };
  }
}

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => TypeOrmConfig.getOrmConfig(configService),
  inject: [ConfigService],
};
