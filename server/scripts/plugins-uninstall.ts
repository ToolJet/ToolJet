import * as availablePlugins from 'src/assets/marketplace/plugins.json';
import { AppModule } from 'src/app.module';
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

  await validateAndUninstallPlugins(nestApp);

  await nestApp.close();
  process.exit(0);
}

async function validateAndUninstallPlugins(nestApp: INestApplication) {
  const pluginsService = nestApp.get(PluginsService);
  const pluginsToUninstall = fetchPluginsToUninstall();
  const validPluginDtos: CreatePluginDto[] = [];
  const invalidPluginDtos: CreatePluginDto[] = [];

  console.log('Plugins to uninstall:', pluginsToUninstall);

  for (const pluginId of pluginsToUninstall) {
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
    // Hence when removing, we are removing all the plugins installed of the same name.
    // If in future we support installing different versions of the same plugin, we should remove it selectively.
    for (const plugin of plugins) {
      await pluginsService.remove(plugin.id);
      pluginDbIds.push(plugin.id);
    }

    console.log('Uninstalled:', dto.id, pluginDbIds);
  }
}

function findPluginDetails(pluginId: string) {
  return availablePlugins.find((p: { id: string }) => p.id === pluginId);
}

function fetchPluginsToUninstall(): string[] {
  if (!ENV_VARS.PLUGINS_TO_UNINSTALL) return [];

  return sanitizedArray(ENV_VARS.PLUGINS_TO_UNINSTALL);
}

function sanitizedArray(string: string): string[] {
  return [...new Set(string.split(',').map((p: string) => p.trim()))];
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
