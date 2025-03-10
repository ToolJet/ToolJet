import { OnModuleInit, RequestMethod, MiddlewareConsumer, DynamicModule } from '@nestjs/common';
import { GetConnection } from './database/getConnection';
import { ShutdownHook } from './schedulers/shut-down.hook';
import { AppModuleLoader } from './loader';
import * as Sentry from '@sentry/node';
import { InstanceSettingsModule } from '@modules/instance-settings/module';
import { AbilityModule } from '@modules/ability/module';
import { LicenseModule } from '@modules/licensing/module';
import { AppConfigModule } from '@modules/configs/module';
import { OrganizationsModule } from '@modules/organizations/module';
import { MetaModule } from '@modules/meta/module';
import { SessionModule } from '@modules/session/module';
import { EncryptionModule } from '@modules/encryption/module';
import { AppController } from './controller';
import { ProfileModule } from '@modules/profile/module';
import { SMTPModule } from '@modules/smtp/module';
import { UsersModule } from '@modules/users/module';
import { FilesModule } from '@modules/files/module';
import { RolesModule } from '@modules/roles/module';
import { GroupPermissionsModule } from '@modules/group-permissions/module';
import { OrganizationUsersModule } from '@modules/organization-users/module';
import { OnboardingModule } from '@modules/onboarding/module';
import { AppEnvironmentsModule } from '@modules/app-environments/module';
import { DataSourcesModule } from '@modules/data-sources/module';
import { LoginConfigsModule } from '@modules/login-configs/module';
import { AuthModule } from '@modules/auth/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { SetupOrganizationsModule } from '@modules/setup-organization/module';
import { FoldersModule } from '@modules/folders/module';
import { WhiteLabellingModule } from '@modules/white-labelling/module';
import { EmailModule } from '@modules/email/module';
import { OrganizationConstantModule } from '@modules/organization-constants/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { DataQueriesModule } from '@modules/data-queries/module';
import { PluginsModule } from '@modules/plugins/module';
import { TemplatesModule } from '@modules/templates/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { TooljetDbModule } from '@modules/tooljet-db/module';
import { WorkflowsModule } from '@modules/workflows/module';
import { AiModule } from '@modules/ai/module';
import { GitSyncModule } from '@modules/git-sync/module';
export class AppModule implements OnModuleInit {
  static async register(configs: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    // Load static and dynamic modules
    const modules = await AppModuleLoader.loadModules(configs);

    /**
     * ████████████████████████████████████████████████████████████████████
     * █                                                                  █
     * █                        MODULE IMPORTS                            █
     * █                                                                  █
     * █   CE/EE/Cloud Implementations should be handled in each module.  █
     * █                                                                  █
     * ████████████████████████████████████████████████████████████████████
     */
    const imports = [
      await AbilityModule.forRoot(configs),
      await LicenseModule.forRoot(configs),
      await FilesModule.register(configs),
      await EncryptionModule.register(configs),
      await InstanceSettingsModule.register(configs),
      await FoldersModule.register(configs),
      await FolderAppsModule.register(configs),
      await SMTPModule.register(configs),
      await RolesModule.register(configs),
      await GroupPermissionsModule.register(configs),
      await AppConfigModule.register(configs),
      await SessionModule.register(configs),
      await MetaModule.register(configs),
      await OrganizationsModule.register(configs),
      await ProfileModule.register(configs),
      await UsersModule.register(configs),
      await OrganizationUsersModule.register(configs),
      await OnboardingModule.register(configs),
      await AppEnvironmentsModule.register(configs),
      await OrganizationConstantModule.register(configs),
      await DataSourcesModule.register(configs),
      await LoginConfigsModule.register(configs),
      await AuthModule.register(configs),
      await ThemesModule.register(configs),
      await SetupOrganizationsModule.register(configs),
      await WhiteLabellingModule.register(configs),
      await EmailModule.register(configs),
      await AppsModule.register(configs),
      await VersionModule.register(configs),
      await DataQueriesModule.register(configs),
      await PluginsModule.register(configs),
      await ImportExportResourcesModule.register(configs),
      await TemplatesModule.register(configs),
      await TooljetDbModule.register(configs),
      await WorkflowsModule.register(configs),
      await AiModule.register(configs),
      await GitSyncModule.register(configs),
    ];

    return {
      module: AppModule,
      imports: [...modules, ...imports],
      controllers: [AppController],
      providers: [ShutdownHook, GetConnection],
    };
  }

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
