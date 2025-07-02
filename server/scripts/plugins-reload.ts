import { getEnvVars } from './database-config-utils';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@modules/app/module';
import { INestApplicationContext } from '@nestjs/common';
import { PluginsService } from '@modules/plugins/service';
import { CreatePluginDto } from '@modules/plugins/dto';
import * as availablePlugins from 'src/assets/marketplace/plugins.json';
import { validateSync } from 'class-validator';
import { EntityManager } from 'typeorm';
import { Plugin } from 'src/entities/plugin.entity';
import { getImportPath, TOOLJET_EDITIONS } from '@modules/app/constants';
import { getTooljetEdition } from '@helpers/utils.helper';

const ENV_VARS = getEnvVars();

async function bootstrap() {
  const nestApp = await NestFactory.createApplicationContext(await AppModule.register({ IS_GET_CONTEXT: true }), {
    logger: ['error', 'warn'],
  });

  await validateAndReloadPlugins(nestApp);

  await nestApp.close();
  process.exit(0);
}

async function validateAndReloadPlugins(nestApp: INestApplicationContext) {
  const edition: TOOLJET_EDITIONS = getTooljetEdition() as TOOLJET_EDITIONS;
  const { PluginsService } = await import(`${await getImportPath(true, edition)}/plugins/service`);
  const pluginsService = nestApp.get(PluginsService);
  const pluginsToReload = fetchPluginsToReload();
  const validPluginDtos: CreatePluginDto[] = [];
  const invalidPluginDtos: CreatePluginDto[] = [];

  console.log('Plugins to reload:', pluginsToReload);

  for (const pluginId of pluginsToReload) {
    const pluginDto = Object.assign(new CreatePluginDto(), findPluginDetails(pluginId));
    const validationErrors = validateSync(pluginDto);

    if (validationErrors.length === 0) {
      validPluginDtos.push(pluginDto);
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
    const entityManager = nestApp.get(EntityManager);
    const plugins = await entityManager.find(Plugin, { where: { pluginId: dto.id } });
    const pluginDbIds = [];

    // Note: Plugins are installed at instance level. But there is no uniqueness check for the plugin.
    // This means that same plugin can be installed multiple times but this is restricted at UI.
    // Hence when reloading, we are reloading all the plugins installed of the same name.
    // If in future we support installing different versions of the same plugin, we should remove it selectively.
    for (const plugin of plugins) {
      await pluginsService.reload(plugin.id);
      pluginDbIds.push(plugin.id);
    }

    console.log('Reloaded:', dto.id, pluginDbIds);
  }
}

function findPluginDetails(pluginId: string) {
  return availablePlugins.find((p: { id: string }) => p.id === pluginId);
}

function fetchPluginsToReload(): string[] {
  if (!ENV_VARS.PLUGINS_TO_RELOAD) return [];
  return sanitizeArray(ENV_VARS.PLUGINS_TO_RELOAD);
}

function sanitizeArray(pluginsToReload: string): string[] {
  return [...new Set(pluginsToReload.split(',').map((pluginId: string) => pluginId.trim()))];
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
