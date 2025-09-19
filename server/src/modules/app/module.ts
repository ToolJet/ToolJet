import { OnModuleInit, RequestMethod, MiddlewareConsumer, DynamicModule } from '@nestjs/common';
import { GetConnection } from './database/getConnection';
import { ShutdownHook } from './schedulers/shut-down.hook';
import { AppModuleLoader } from './loader';
import * as Sentry from '@sentry/node';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
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
import { CustomStylesModule } from '@modules/custom-styles/module';
import { AppPermissionsModule } from '@modules/app-permissions/module';
import { EventsModule } from '@modules/events/module';
import { ExternalApiModule } from '@modules/external-apis/module';
import { GitSyncModule } from '@modules/git-sync/module';
import { AppGitModule } from '@modules/app-git/module';
import { OrganizationPaymentModule } from '@modules/organization-payments/module';
import { CrmModule } from '@modules/CRM/module';
import { ClearSSOResponseScheduler } from '@modules/auth/schedulers/clear-sso-response.scheduler';
import { SampleDBScheduler } from '@modules/data-sources/schedulers/sample-db.scheduler';
import { SessionScheduler } from '@modules/session/scheduler';
import { AuditLogsClearScheduler } from '@modules/audit-logs/scheduler';
import { ModulesModule } from '@modules/modules/module';
import { EmailListenerModule } from '@modules/email-listener/module';
import { InMemoryCacheModule } from '@modules/inMemoryCache/module';
import { reconfigurePostgrest, reconfigurePostgrestWithoutSchemaSync } from '@modules/tooljet-db/helper';
import { isSQLModeDisabled } from '@helpers/tooljet_db.helper';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectEntityManager } from '@nestjs/typeorm';
import { SystemMetricsService } from './services/system-metrices.service';

export class AppModule implements OnModuleInit {
  constructor(
    private configService: ConfigService,
    @InjectEntityManager('tooljetDb')
    private readonly tooljetDbManager: EntityManager
  ) {}

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
    const baseImports = [
      await AbilityModule.forRoot(configs),
      await LicenseModule.forRoot(configs),
      await FilesModule.register(configs, true),
      //await EncryptionModule.register(configs, true),
      await InstanceSettingsModule.register(configs, true),
      await FoldersModule.register(configs, true),
      await FolderAppsModule.register(configs, true),
      await SMTPModule.register(configs, true),
      await RolesModule.register(configs, true),
      await GroupPermissionsModule.register(configs, true),
      await AppConfigModule.register(configs, true),
      await SessionModule.register(configs, true),
      await MetaModule.register(configs, true),
      await OrganizationsModule.register(configs, true),
      await ProfileModule.register(configs, true),
      await UsersModule.register(configs, true),
      await OrganizationUsersModule.register(configs, true),
      await OnboardingModule.register(configs, true),
      await AppEnvironmentsModule.register(configs, true),
      await OrganizationConstantModule.register(configs, true),
      await DataSourcesModule.register(configs, true),
      await LoginConfigsModule.register(configs, true),
      await AuthModule.register(configs, true),
      await ThemesModule.register(configs, true),
      await SetupOrganizationsModule.register(configs, true),
      await WhiteLabellingModule.register(configs, true),
      //await EmailModule.register(configs, true),
      await AppsModule.register(configs, true),
      await VersionModule.register(configs, true),
      await DataQueriesModule.register(configs, true),
      await PluginsModule.register(configs, true),
      await ImportExportResourcesModule.register(configs, true),
      await TemplatesModule.register(configs, true),
      await TooljetDbModule.register(configs, true),
      await ModulesModule.register(configs, true),
      await AiModule.register(configs, true),
      await CustomStylesModule.register(configs, true),
      await AppPermissionsModule.register(configs, true),
      await EventsModule.register(configs, true),
      await ExternalApiModule.register(configs, true),
      await GitSyncModule.register(configs, true),
      await AppGitModule.register(configs, true),
      await CrmModule.register(configs, true),
      await OrganizationPaymentModule.register(configs, true),
      await EmailListenerModule.register(configs, true),
      //await InMemoryCacheModule.register(configs, true),
    ];

    const conditionalImports = [];
    if (getTooljetEdition() !== TOOLJET_EDITIONS.Cloud) {
      conditionalImports.push(await WorkflowsModule.register(configs, true));
    }

    const imports = [...baseImports, ...conditionalImports];

    return {
      module: AppModule,
      imports: [...modules, ...imports],
      controllers: [AppController],
      providers: [
        ShutdownHook,
        GetConnection,
        ClearSSOResponseScheduler,
        SampleDBScheduler,
        SessionScheduler,
        AuditLogsClearScheduler,
        SystemMetricsService,
      ],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }

  async onModuleInit() {
    console.log(`Version: ${globalThis.TOOLJET_VERSION}`);
    console.log(`Initializing server modules 📡 `);

    if (!process.env.WORKER) {
      const tooljtDbUser = this.configService.get('TOOLJET_DB_USER');
      const statementTimeout = this.configService.get('TOOLJET_DB_STATEMENT_TIMEOUT') || 60000;
      const statementTimeoutInSecs = Number.isNaN(Number(statementTimeout)) ? 60 : Number(statementTimeout) / 1000;

      if (isSQLModeDisabled()) {
        await reconfigurePostgrestWithoutSchemaSync(this.tooljetDbManager, {
          user: tooljtDbUser,
          enableAggregates: true,
          statementTimeoutInSecs: statementTimeoutInSecs,
        });
      } else {
        await reconfigurePostgrest(this.tooljetDbManager, {
          user: tooljtDbUser,
          enableAggregates: true,
          statementTimeoutInSecs: statementTimeoutInSecs,
        });
      }

      await this.tooljetDbManager.query("NOTIFY pgrst, 'reload schema'");
    }
  }
}
