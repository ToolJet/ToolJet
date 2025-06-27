import * as availablePlugins from '../src/assets/marketplace/plugins.json';
import { AppModule } from '@modules/app/module';
import { CreatePluginDto } from '@modules/plugins/dto';
import { EntityManager } from 'typeorm';
import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Plugin } from 'src/entities/plugin.entity';
import { getEnvVars } from './database-config-utils';
import { validateSync } from 'class-validator';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

const ENV_VARS = getEnvVars();

async function bootstrap() {
  const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }), {
    logger: ['error', 'warn'],
  });

  await validateAndInstallPlugins(nestApp);

  await nestApp.close();
  process.exit(0);
}

async function validateAndInstallPlugins(nestApp: INestApplicationContext) {
  const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
  const { PluginsService } = await import(`${await getImportPath(true, edition)}/plugins/service`);
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
