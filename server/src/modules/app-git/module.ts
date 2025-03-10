import { DynamicModule } from '@nestjs/common';
import { getImportPath } from '@modules/app/constants';
import { FeatureAbilityFactory } from './ability';
import { OrganizationGitSyncRepository } from '@modules/git-sync/repository';
import { VersionRepository } from '@modules/versions/repository';
import { AppsRepository } from '@modules/apps/repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppGitSync } from 'src/entities/app_git_sync.entity';
import { DataSourcesModule } from '@modules/data-sources/module';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppsModule } from '@modules/apps/module';
import { VersionModule } from '@modules/versions/module';
import { ThemesModule } from '@modules/organization-themes/module';
import { FolderAppsModule } from '@modules/folder-apps/module';
import { FoldersModule } from '@modules/folders/module';
import { ImportExportResourcesModule } from '@modules/import-export-resources/module';
import { InternalTableRepository } from '@modules/tooljet-db/repository';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { AiConversationRepository } from '@modules/ai/repositories/ai-conversation.repository';
import { AiConversationMessageRepository } from '@modules/ai/repositories/ai-conversation-message.repository';
import { AiResponseVoteRepository } from '@modules/ai/repositories/ai-response-vote.repository';

export class AppGitModule {
  static async register(configs?: { IS_GET_CONTEXT: boolean }): Promise<DynamicModule> {
    const importPath = await getImportPath(configs?.IS_GET_CONTEXT);
    const { AppGitController } = await import(`${importPath}/app-git/controller`);
    const { AppGitService } = await import(`${importPath}/app-git/service`);
    const { AppGitUtilService } = await import(`${importPath}/app-git/util.service`);
    const { GitSyncUtilService } = await import(`${importPath}/git-sync/util.service`);
    const { TooljetDbImportExportService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-import-export.service`
    );
    const { ImportExportResourcesService } = await import(`${importPath}/import-export-resources/service`);
    const { AppsService } = await import(`${importPath}/apps/service`);
    const { VersionService } = await import(`${importPath}/versions/service`);
    const { AppImportExportService } = await import(`${importPath}/apps/services/app-import-export.service`);
    const { TooljetDbTableOperationsService } = await import(
      `${importPath}/tooljet-db/services/tooljet-db-table-operations.service`
    );
    const { AppEnvironmentUtilService } = await import(`${importPath}/app-environments/util.service`);
    const { ComponentsService } = await import(`${importPath}/apps/services/component.service`);
    const { EventsService } = await import(`${importPath}/apps/services/event.service`);
    const { PageService } = await import(`${importPath}/apps/services/page.service`);
    const { PageHelperService } = await import(`${importPath}/apps/services/page.util.service`);
    const { VersionsCreateService } = await import(`${importPath}/versions/services/create.service`);
    const { AiUtilService } = await import(`${importPath}/ai/util.service`);

    return {
      module: AppGitModule,
      imports: [
        TypeOrmModule.forFeature([AppGitSync, VersionRepository]),
        await DataSourcesModule.register(configs),
        await AppsModule.register(configs),
        await VersionModule.register(configs),
        await ThemesModule.register(configs),
        await VersionModule.register(configs),
        await FolderAppsModule.register(configs),
        await FoldersModule.register(configs),
        await ImportExportResourcesModule.register(configs),
      ],
      providers: [
        AppGitService,
        AppGitUtilService,
        OrganizationGitSyncRepository,
        VersionRepository,
        FeatureAbilityFactory,
        GitSyncUtilService,
        TooljetDbImportExportService,
        TooljetDbTableOperationsService,
        AppsRepository,
        AppImportExportService,
        VersionService,
        AppsService,
        ImportExportResourcesService,
        DataSourcesRepository,
        AppEnvironmentUtilService,
        ComponentsService,
        EventsService,
        PageService,
        PageHelperService,
        VersionsCreateService,
        AiUtilService,
        InternalTableRepository,
        DataQueryRepository,
        AiConversationRepository,
        AiConversationMessageRepository,
        AiResponseVoteRepository,
      ],
      controllers: [AppGitController],
      exports: [AppGitUtilService],
    };
  }
}
