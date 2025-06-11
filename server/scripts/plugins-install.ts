import * as availablePlugins from '../src/assets/marketplace/plugins.json';
import { AppModule } from '../src/app.module';
import { CreatePluginDto } from '@dto/create-plugin.dto';
import { EntityManager } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Plugin } from 'src/entities/plugin.entity';
import { PluginsService } from '@services/plugins.service';
import { getEnvVars } from './database-config-utils';
import { validateSync } from 'class-validator';

const ENV_VARS = getEnvVars();

async function bootstrap() {
  const nestApp = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  });

  await validateAndInstallPlugins(nestApp);

  await nestApp.close();
  process.exit(0);
}

async function validateAndInstallPlugins(nestApp: INestApplication) {
  const pluginsService = nestApp.get(PluginsService);
  const pluginsToInstall = fetchPluginsToInstall();
  const validPluginDtos: CreatePluginDto[] = [];
  const invalidPluginDtos: CreatePluginDto[] = [];
  const entityManager = nestApp.get(EntityManager);

  console.log('Plugins to install:', pluginsToInstall);

  for (const pluginId of pluginsToInstall) {
    const pluginDto = Object.assign(new CreatePluginDto(), findPluginDetails(pluginId));
    const validationErrors = validateSync(pluginDto);

    if (validationErrors.length === 0) {
      const plugin = await entityManager.findOne(Plugin, { where: { pluginId: pluginDto.id } });
      plugin ? invalidPluginDtos.push(pluginDto) : validPluginDtos.push(pluginDto);
    } else {
      console.log(`Plugin with ID '${pluginId}' has validation errors:`, validationErrors);
      invalidPluginDtos.push(pluginDto);
    }
  }

  invalidPluginDtos.length > 0 &&
    console.log(
      'Skipping invalid plugins:',
      invalidPluginDtos.map((dto) => dto.id),
      '\n'
    );

  for (const dto of validPluginDtos) {
    await pluginsService.install(dto);
    console.log('Installed:', dto.id);
  }
}

function findPluginDetails(pluginId: string) {
  return availablePlugins.find((p: { id: string }) => p.id === pluginId);
}

function fetchPluginsToInstall(): string[] {
  if (!ENV_VARS.PLUGINS_TO_INSTALL) return [];

  return sanitizedArray(ENV_VARS.PLUGINS_TO_INSTALL);
}

function sanitizedArray(string: string): string[] {
  return [...new Set(string.split(',').map((p: string) => p.trim()))];
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
