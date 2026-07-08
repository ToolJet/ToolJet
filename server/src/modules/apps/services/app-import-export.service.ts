import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isEmpty, set } from 'lodash';
import { isUUID } from 'class-validator';
import { App } from 'src/entities/app.entity';
import { AppEnvironment } from 'src/entities/app_environments.entity';
import { AppVersion, AppVersionStatus, AppVersionType } from 'src/entities/app_version.entity';
import { DataQuery } from 'src/entities/data_query.entity';
import { DataSource } from 'src/entities/data_source.entity';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';
import { Credential } from '@entities/credential.entity';
import { User } from 'src/entities/user.entity';
import { Brackets, EntityManager, In, DeepPartial } from 'typeorm';
import {
  defaultAppEnvironments,
  catchDbException,
  extractMajorVersion,
  isTooljetVersionWithNormalizedAppDefinitionSchem,
  isVersionGreaterThanOrEqual,
} from 'src/helpers/utils.helper';
import { dbTransactionWrap } from 'src/helpers/database.helper';
import { repairParentCycles } from 'src/helpers/parent_cycle.helper';
import { TransactionLogger } from '@modules/logging/service';
import { Organization } from 'src/entities/organization.entity';
import { DataBaseConstraints } from 'src/helpers/db_constraints.constants';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Plugin } from 'src/entities/plugin.entity';
import { Page, PageOpenIn, PageType } from 'src/entities/page.entity';
import { Component } from 'src/entities/component.entity';
import { Layout } from 'src/entities/layout.entity';
import { EventHandler, Target } from 'src/entities/event_handler.entity';
import { v4 as uuid } from 'uuid';
import { updateEntityReferences } from 'src/helpers/import_export.helpers';
import { remapFlexContainerChildOrder } from '@modules/versions/helpers/version-copy-parent.helper';
import { DataSourceScopes, DataSourceTypes } from '@modules/data-sources/constants';
import { LayoutDimensionUnits } from '../constants';
import { convertAppDefinitionFromSinglePageToMultiPage } from 'src/../lib/single-page-to-and-from-multipage-definition-conversion';
import { DataSourcesUtilService } from '@modules/data-sources/util.service';
import { DataSourcesRepository } from '@modules/data-sources/repository';
import { AppsRepository } from '../repository';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { ComponentsService } from './component.service';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { APP_ERROR_TYPE } from '@helpers/error_type.constant';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';
import { PagePermission } from '@entities/page_permissions.entity';
import { PageUser } from '@entities/page_users.entity';
import { APP_TYPES } from '@modules/apps/constants';
import { UsersUtilService } from '@modules/users/util.service';
import { DataQueryFolder } from '@entities/data_query_folder.entity';
import { DataQueryFolderMapping, ChildType } from '@entities/data_query_folder_mapping.entity';
import { QueryPermission } from '@entities/query_permissions.entity';
import { QueryUser } from '@entities/query_users.entity';
import { ComponentPermission } from '@entities/component_permissions.entity';
import { ComponentUser } from '@entities/component_users.entity';
import { OrganizationGitSync } from '@entities/organization_git_sync.entity';
import { WorkspaceBranch } from '@entities/workspace_branch.entity';
interface AppResourceMappings {
  defaultDataSourceIdMapping: Record<string, string>;
  dataQueryMapping: Record<string, string>;
  appVersionMapping: Record<string, string>;
  appEnvironmentMapping: Record<string, string>;
  appDefaultEnvironmentMapping: Record<string, string[]>;
  pagesMapping: Record<string, string>;
  componentsMapping: Record<string, string>;
  dataSourceMapping: Record<string, string>;
  dataSourceOptionsMapping: Record<string, string>;
  layoutMapping: Record<string, string>;
  versionGitIdMapping: Record<string, string>;
}

type DefaultDataSourceName =
  | 'restapidefault'
  | 'runjsdefault'
  | 'runpydefault'
  | 'tooljetdbdefault'
  | 'workflowsdefault';

type PartialRevampedComponent = 'CodeEditor' | 'PDF' | 'Calendar' | 'CustomComponent' | 'RadioButtonV2';

type NewRevampedComponent =
  | 'Text'
  | 'TextInput'
  | 'PasswordInput'
  | 'NumberInput'
  | 'EmailInput'
  | 'DropdownV2'
  | 'Table'
  | 'Button'
  | 'Cascader'
  | 'Checkbox'
  | 'Divider'
  | 'VerticalDivider'
  | 'Link'
  | 'Datepicker'
  | 'DatePickerV2'
  | 'TimePicker'
  | 'DatetimePickerV2'
  | 'DaterangePicker'
  | 'TextArea'
  | 'Container'
  | 'FlexContainer'
  | 'Tabs'
  | 'Form'
  | 'Image'
  | 'FilePicker'
  | 'Icon'
  | 'Steps'
  | 'Statistics'
  | 'StarRating'
  | 'Tags'
  | 'CircularProgressBar'
  | 'Html'
  | 'Chat'
  | 'CurrencyInput'
  | 'PhoneInput'
  | 'IFrame'
  | 'DropdownV2'
  | 'TreeSelect'
  | 'Listview'
  | 'ColorPicker'
  | 'ButtonGroupV2'
  | 'ModalV2'
  | 'PopoverMenu'
  | 'Pagination';

const DefaultDataSourceNames: DefaultDataSourceName[] = [
  'restapidefault',
  'runjsdefault',
  'runpydefault',
  'tooljetdbdefault',
  'workflowsdefault',
];
const NewRevampedComponents: NewRevampedComponent[] = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'EmailInput',
  'DropdownV2',
  'Table',
  'Checkbox',
  'Button',
  'Cascader',
  'Divider',
  'VerticalDivider',
  'Link',
  'Datepicker',
  'DatePickerV2',
  'TimePicker',
  'DatetimePickerV2',
  'DaterangePicker',
  'TextArea',
  'Container',
  'FlexContainer',
  'Tabs',
  'Form',
  'Image',
  'FilePicker',
  'Icon',
  'Steps',
  'Statistics',
  'StarRating',
  'Tags',
  'CircularProgressBar',
  'Html',
  'Chat',
  'CurrencyInput',
  'PhoneInput',
  'IFrame',
  'DropdownV2',
  'TreeSelect',
  'Listview',
  'ColorPicker',
  'ButtonGroupV2',
  'ModalV2',
  'PopoverMenu',
  'Pagination',
];

const PartialRevampedComponents: PartialRevampedComponent[] = [
  'CodeEditor',
  'PDF',
  'Calendar',
  'CustomComponent',
  'RadioButtonV2',
];

const INPUT_WIDGET_TYPES = [
  'TextInput',
  'NumberInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'TimePicker',
  'DatetimePickerV2',
  'TextArea',
  'DropdownV2',
  'MultiselectV2',
  'RadioButtonV2',
  'RangeSliderV2',
];

const entitiesToRemoveTimestamps = [
  'components',
  'pages',
  'events',
  'dataQueries',
  'dataSources',
  'appVersions',
  'dataSourcesOptions',
  'appEnvironments',
  'modules',
  'schemaDetails',
];
const SHOW_CLEAR_BTN_COMPONENT_TYPES = [
  'TextInput',
  'NumberInput',
  'EmailInput',
  'CurrencyInput',
  'PhoneInput',
  'Datepicker',
  'DatePickerV2',
  'DatetimePickerV2',
  'TimePicker',
  'DaterangePicker',
];

const PLACEHOLDER_DATE_TIME_COMPONENT: Record<string, string> = {
  Datepicker: 'Select date',
  DatePickerV2: 'Select date',
  DatetimePickerV2: 'Select date and time',
  TimePicker: 'Select time',
  DaterangePicker: 'Select Date Range',
};

const DYNAMIC_HEIGHT_COMPONENT_TYPES = [
  'Accordion',
  'Button',
  'ButtonGroupV2',
  'Cascader',
  'Checkbox',
  'CodeEditor',
  'ColorPicker',
  'Container',
  'FlexContainer',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'DatetimePickerV2',
  'DropdownV2',
  'EmailInput',
  'Form',
  'Html',
  'Image',
  'JSONEditor',
  'JSONExplorer',
  'KeyValuePair',
  'Listview',
  'ModalV2',
  'MultiselectV2',
  'NumberInput',
  'PasswordInput',
  'PhoneInput',
  'RadioButtonV2',
  'RichTextEditor',
  'StarRating',
  'Table',
  'Tabs',
  'TagsInput',
  'Text',
  'TextArea',
  'TextInput',
  'TimePicker',
  'ToggleSwitchV2',
  'TreeSelect',
];

const PLACEHOLDER_TEXT_COLOR_COMPONENT_TYPES = ['TextInput', 'PasswordInput', 'NumberInput', 'DropdownV2', 'Cascader'];

const MAX_LIMIT_COMPONENT_TYPES = ['MultiselectV2'];

const TOOLTIP_FORMAT_COMPONENT_TYPES = [
  'Accordion',
  'AudioRecorder',
  'Button',
  'ButtonGroupV2',
  'Camera',
  'Cascader',
  'Checkbox',
  'CircularProgressBar',
  'ColorPicker',
  'Container',
  'CurrencyInput',
  'DatePickerV2',
  'DaterangePicker',
  'DatetimePickerV2',
  'Divider',
  'DropdownV2',
  'EmailInput',
  'FileButton',
  'FileInput',
  'FilePicker',
  'Form',
  'Icon',
  'IFrame',
  'Image',
  'JSONEditor',
  'JSONExplorer',
  'Kanban',
  'KeyValuePair',
  'Link',
  'Listview',
  'ModalV2',
  'MultiselectV2',
  'NumberInput',
  'PasswordInput',
  'PhoneInput',
  'PopoverMenu',
  'ProgressBar',
  'RadioButtonV2',
  'RangeSliderV2',
  'ReorderableList',
  'StarRating',
  'Statistics',
  'Tabs',
  'Tags',
  'TagsInput',
  'Text',
  'TextArea',
  'TextInput',
  'TimePicker',
  'ToggleSwitchV2',
  'TreeSelect',
  'VerticalDivider',
];

@Injectable()
export class AppImportExportService {
  constructor(
    protected dataSourcesUtilService: DataSourcesUtilService,
    protected dataSourcesRepository: DataSourcesRepository,
    protected appEnvironmentUtilService: AppEnvironmentUtilService,
    protected usersUtilService: UsersUtilService,
    protected componentsService: ComponentsService,
    protected entityManager: EntityManager,
    protected appsRepository: AppsRepository,
    protected readonly transactionLogger: TransactionLogger
  ) {}

  private getEventHandlerName(event: any): string {
    if (typeof event?.name === 'string' && event.name.trim()) {
      return event.name.trim();
    }

    if (typeof event?.eventId === 'string' && event.eventId.trim()) {
      return event.eventId.trim();
    }

    return '';
  }

  async export(user: User, id: string, searchParams: any = {}, branchId?: string): Promise<{ appV2: App }> {
    // https://github.com/typeorm/typeorm/issues/3857
    // Making use of query builder
    // filter by search params
    const versionId = searchParams?.version_id;
    return await dbTransactionWrap(async (manager: EntityManager) => {
      // findById runs the metadata overlay so app.name/slug/icon/isPublic resolve from
      // the right app_versions row (branch-aware) instead of leaking raw NULL apps.*
      // columns into the exported JSON for non-workflow apps.
      const appToExport = await this.appsRepository.findById(id, user?.organizationId, versionId, branchId);

      const queryAppVersions = manager
        .createQueryBuilder(AppVersion, 'app_versions')
        .where('app_versions.appId = :appId', {
          appId: appToExport.id,
        });

      if (versionId) {
        queryAppVersions.andWhere('app_versions.id = :versionId', {
          versionId,
        });
      } else if (branchId && appToExport.type !== APP_TYPES.WORKFLOW) {
        // Sub-branch file export — export only the BRANCH-type row that owns
        // this sub-branch's editable state. Default-branch exports are blocked
        // upstream in import-export-resources/service.ts. Workflows skip the
        // filter (they don't carry branch_id on app_versions).
        queryAppVersions
          .andWhere('app_versions.branchId = :branchId', { branchId })
          .andWhere('app_versions.versionType = :branchVersionType', {
            branchVersionType: AppVersionType.BRANCH,
          });
      }
      const appVersions = await queryAppVersions.orderBy('app_versions.created_at', 'ASC').getMany();

      const legacyLocalDataSources =
        appVersions?.length &&
        (await manager
          .createQueryBuilder(DataSource, 'data_sources')
          .where('data_sources.appVersionId IN(:...versionId)', {
            versionId: appVersions.map((v) => v.id),
          })
          .andWhere('data_sources.scope != :scope', {
            scope: DataSourceScopes.GLOBAL,
          })
          .orderBy('data_sources.created_at', 'ASC')
          .getMany());

      const appEnvironments = await manager
        .createQueryBuilder(AppEnvironment, 'app_environments')
        .where('app_environments.organizationId = :organizationId', {
          organizationId: user?.organizationId,
        })
        .orderBy('app_environments.createdAt', 'ASC')
        .getMany();

      let dataQueries: DataQuery[] = [];
      let dataSourceOptions: any[] = [];

      const globalQueries: DataQuery[] = await manager
        .createQueryBuilder(DataQuery, 'data_query')
        .innerJoinAndSelect('data_query.dataSource', 'dataSource')
        .where('data_query.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .andWhere('dataSource.scope = :scope', {
          scope: DataSourceScopes.GLOBAL,
        })
        .getMany();

      const globalDataSources = [...new Map(globalQueries.map((gq) => [gq.dataSource.id, gq.dataSource])).values()];

      const dataSources = [...legacyLocalDataSources, ...globalDataSources];

      if (dataSources?.length) {
        dataQueries = await manager
          .createQueryBuilder(DataQuery, 'data_queries')
          .leftJoinAndSelect('data_queries.permissions', 'permission')
          .leftJoinAndSelect('permission.users', 'queryUser')
          .leftJoinAndSelect('queryUser.permissionGroup', 'permissionGroup')
          .where('data_queries.dataSourceId IN(:...dataSourceId)', {
            dataSourceId: dataSources?.map((v) => v.id),
          })
          .andWhere('data_queries.appVersionId IN(:...versionId)', {
            versionId: appVersions.map((v) => v.id),
          })
          .orderBy('data_queries.created_at', 'ASC')
          .getMany();

        // Backfill `kind` and `dataSourceType` on each query from its DS. The query above
        // does NOT join data_query.dataSource so @AfterLoad leaves these undefined.
        // `kind` lets a git-pulled app recover the right plugin/kind for dummies when the
        // root data-sources file is missing. `dataSourceType` is the type disambiguator
        // — `static`, `sample`, or `default` — used by import to route queries to the
        // target workspace's existing row. STATIC + SAMPLE are filtered out of
        // workspace git push (see workspace-git-sync-adapter.serializeDataSources), so
        // an app-only push leaves no stub file at data-sources/<coRelId>.json for them;
        // import relies on this stamp to identify the reference.
        const dsKindById = new Map(dataSources.map((ds: DataSource) => [ds.id, ds.kind] as [string, string]));
        const dsTypeById = new Map(dataSources.map((ds: DataSource) => [ds.id, ds.type] as [string, string]));
        for (const dq of dataQueries) {
          if (!dq.kind) dq.kind = dsKindById.get(dq.dataSourceId);
          if (!(dq as any).dataSourceType) (dq as any).dataSourceType = dsTypeById.get(dq.dataSourceId);
        }

        const rawAndEntities = await manager
          .createQueryBuilder(DataSourceVersionOptions, 'dsvo')
          .innerJoin(DataSourceVersion, 'dsv', 'dsv.id = dsvo.dataSourceVersionId AND dsv.isDefault = true')
          .where('dsvo.environmentId IN(:...environmentId) AND dsv.dataSourceId IN(:...dataSourceId)', {
            environmentId: appEnvironments.map((v) => v.id),
            dataSourceId: dataSources.map((v) => v.id),
          })
          .addSelect('dsv.dataSourceId', 'dataSourceId')
          .orderBy('dsvo.createdAt', 'ASC')
          .getRawAndEntities();

        // Map DSVO records to the legacy export shape (with dataSourceId)
        dataSourceOptions = rawAndEntities.raw.map((raw, i) => {
          const entity = rawAndEntities.entities[i];
          return {
            id: entity.id,
            options: entity.options,
            environmentId: entity.environmentId,
            dataSourceId: raw.dsv_dataSourceId || raw.dataSourceId,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
          };
        });

        dataSourceOptions?.forEach((dso) => {
          delete dso?.options?.tokenData;
        });
      }

      const pages = await manager
        .createQueryBuilder(Page, 'page')
        .leftJoinAndSelect('page.permissions', 'permission')
        .leftJoinAndSelect('permission.users', 'pageUser')
        .leftJoinAndSelect('pageUser.permissionGroup', 'permissionGroup')
        .where('page.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .orderBy('page.created_at', 'ASC')
        .getMany();

      const pagesWithPermissionGroups = pages.map((page) => {
        const groupPermission = page.permissions.find((perm) => perm.type === 'GROUP');

        return {
          ...page,
          permissions: groupPermission
            ? {
                permissionGroup: groupPermission.users
                  .map((user) => user.permissionGroup?.name)
                  .filter((name): name is string => Boolean(name)),
              }
            : undefined,
        };
      });

      const queriesWithPermissionGroups = dataQueries.map((query) => {
        const groupPermission = query.permissions.find((perm) => perm.type === 'GROUP');

        return {
          ...query,
          permissions: groupPermission
            ? {
                permissionGroup: groupPermission.users
                  .map((user) => user.permissionGroup?.name)
                  .filter((name): name is string => Boolean(name)),
              }
            : undefined,
        };
      });

      // Remove updatedAt to avoid unnecessary conflicts during merge in Git Sync
      for (const query of queriesWithPermissionGroups) {
        delete query.updatedAt;
      }
      // Added orderBy for layouts as well to maintain consistency -> in the exported file and avoid merge conflicts
      const components =
        pages.length > 0
          ? await manager
              .createQueryBuilder(Component, 'components')
              .leftJoinAndSelect('components.layouts', 'layouts')
              .leftJoinAndSelect('components.permissions', 'permission')
              .leftJoinAndSelect('permission.users', 'componentUser')
              .leftJoinAndSelect('componentUser.permissionGroup', 'permissionGroup')
              .where('components.pageId IN(:...pageId)', {
                pageId: pages.map((v) => v.id),
              })
              .orderBy('components.created_at', 'ASC')
              .addOrderBy('layouts.type', 'ASC')
              .getMany()
          : [];
      const appModules = components.filter((c) => c.type === 'ModuleViewer' || c.properties?.moduleAppId);
      const moduleAppIds = appModules.map((moduleComponent) => ({
        moduleId: moduleComponent.properties?.moduleAppId.value,
        // moduleVersionId.value holds the version's co_relation_id (portable git identity).
        // The git-sync adapter writes co_relation_id as the version `id` in exported JSON,
        // so pulled/imported data and locally-created refs both use co_relation_id.
        // Empty string signals an unpinned ref.
        versionIdentifier: moduleComponent.properties?.moduleVersionId?.value,
      }));

      // Deduplicate: multiple ModuleViewer components may reference the same module.
      // Keep one entry per unique moduleId (co_relation_id).
      const seenExportModuleIds = new Set<string>();
      const uniqueModuleAppIds = moduleAppIds.filter((m) => {
        if (!m.moduleId || seenExportModuleIds.has(m.moduleId)) return false;
        seenExportModuleIds.add(m.moduleId);
        return true;
      });

      // moduleAppId.value stores co_relation_id after migration — resolve to real DB ids
      // so this.export() can fetch the module app correctly.
      const coRelationIds = uniqueModuleAppIds.map((m) => m.moduleId).filter(Boolean);
      const moduleAppsById: Record<string, string> = {};
      if (coRelationIds.length > 0) {
        const resolvedModules = await manager
          .createQueryBuilder(App, 'app')
          .where('app.co_relation_id IN (:...coRelationIds)', { coRelationIds })
          .andWhere('app.organization_id = :organizationId', { organizationId: appToExport.organizationId })
          .andWhere('app.type = :moduleType', { moduleType: APP_TYPES.MODULE })
          .select(['app.id', 'app.co_relation_id'])
          .getMany();
        for (const mod of resolvedModules) {
          moduleAppsById[mod.co_relation_id] = mod.id;
        }
      }

      // The parent app is exported branch-scoped (search_params.version_id is set
      // by the push caller), so appVersions is filtered to a single row whose
      // branchId is the branch being pushed. Use that to pick a single, branch-local
      // module row when the consumer's ModuleViewer is unpinned — without this, an
      // empty pin falls through to the "no version_id" branch in this.export() and
      // every row of the module's app_versions ends up in modules/<m>/versions/,
      // which both violates the one-version-per-branch git contract and triggers
      // a Date.now() name collision in the pull-side hydrate rename loop.
      const parentBranchId = appVersions[0]?.branchId;

      const moduleApps = [];
      await Promise.all(
        uniqueModuleAppIds.map(async (moduleAppId) => {
          const resolvedId = moduleAppsById[moduleAppId.moduleId] ?? moduleAppId.moduleId;

          let versionDbId: string | undefined;
          if (moduleAppId.versionIdentifier && isUUID(moduleAppId.versionIdentifier) && resolvedId) {
            // PINNED: moduleVersionId.value stores the version's co_relation_id
            // (portable git identity) after the git-sync adapter rewrites ids.
            // Try co_relation_id first; fall back to module_reference_id for legacy data.
            const byCoRelId = await manager.findOne(AppVersion, {
              where: { co_relation_id: moduleAppId.versionIdentifier, appId: resolvedId },
            });
            versionDbId = byCoRelId?.id;

            if (!versionDbId) {
              const byRefId = await manager.findOne(AppVersion, {
                where: { moduleReferenceId: moduleAppId.versionIdentifier, appId: resolvedId },
              });
              versionDbId = byRefId?.id;
            }
          }

          // Fall through to branch-local resolution when:
          //   - The pin didn't resolve (cross-workspace import where module_reference_id
          //     from the source workspace doesn't exist locally), OR
          //   - The module ref was unpinned (empty versionIdentifier).
          // Without this fallthrough, an unresolvable pin causes export() to run without
          // a version_id filter, pulling ALL app_versions (including stubs on other
          // branches) into the serialized module — breaking the one-version-per-branch
          // git contract.
          if (!versionDbId && resolvedId && parentBranchId) {
            const branchRow = await manager.findOne(AppVersion, {
              where: { appId: resolvedId, branchId: parentBranchId, isStub: false },
              order: { createdAt: 'DESC' },
            });
            if (branchRow) {
              versionDbId = branchRow.id;
            } else {
              const defaultBranch = await manager.findOne(WorkspaceBranch, {
                where: { organizationId: appToExport.organizationId, isDefault: true },
              });
              if (defaultBranch) {
                const defaultRow = await manager.findOne(AppVersion, {
                  where: { appId: resolvedId, branchId: defaultBranch.id, isStub: false },
                  order: { createdAt: 'DESC' },
                });
                versionDbId = defaultRow?.id;
              }
            }
          }

          moduleApps.push(await this.export(user, resolvedId, { version_id: versionDbId }, parentBranchId));
        })
      );

      const componentsWithPermissionGroups = components.map((component) => {
        const groupPermission = component.permissions.find((perm) => perm.type === 'GROUP');

        return {
          ...component,
          // updatedAt: query?.updatedAt,
          permissions: groupPermission
            ? {
                permissionGroup: groupPermission.users
                  .map((user) => user.permissionGroup?.name)
                  .filter((name): name is string => Boolean(name)),
              }
            : undefined,
        };
      });

      const events = await manager
        .createQueryBuilder(EventHandler, 'event_handlers')
        .where('event_handlers.appVersionId IN(:...versionId)', {
          versionId: appVersions.map((v) => v.id),
        })
        .orderBy('event_handlers.created_at', 'ASC')
        .getMany();

      const appVersionIds = appVersions.map((v) => v.id);
      const dataQueryFolders = await manager.find(DataQueryFolder, {
        where: { appVersionId: In(appVersionIds) },
      });
      const folderIds = dataQueryFolders.map((f) => f.id);
      const dataQueryIds = queriesWithPermissionGroups.map((q: any) => q.id);
      const allChildIds = [...folderIds, ...dataQueryIds];
      const dataQueryFolderMappings =
        allChildIds.length > 0
          ? await manager.find(DataQueryFolderMapping, { where: { childId: In(allChildIds) } })
          : [];

      // Non-workflow apps store name/slug/icon/isPublic on app_versions, not on apps.*.
      // Project the metadata onto the top-level export object so the consumer sees it on
      // app.json, then strip those fields from the version rows so they don't duplicate
      // into per-version files. Workflows leave the export unchanged — apps.* already
      // carries the canonical metadata for them.
      if (appToExport?.type !== APP_TYPES.WORKFLOW) {
        // this.appsRepository.findById sets app meta data from versions to app
        for (const v of appVersions) {
          delete (v as any).appName;
          delete (v as any).slug;
          delete (v as any).icon;
          delete (v as any).isPublic;
        }
      }

      appToExport['components'] = componentsWithPermissionGroups;
      appToExport['pages'] = pagesWithPermissionGroups;
      appToExport['events'] = events;
      appToExport['dataQueries'] = queriesWithPermissionGroups;
      appToExport['dataSources'] = dataSources;
      appToExport['dataQueryFolders'] = dataQueryFolders;
      appToExport['dataQueryFolderMappings'] = dataQueryFolderMappings;
      appToExport['appVersions'] = appVersions;
      appToExport['appEnvironments'] = appEnvironments;
      appToExport['dataSourceOptions'] = dataSourceOptions;
      appToExport['schemaDetails'] = {
        multiPages: true,
        multiEnv: true,
        globalDataSources: true,
      };
      if (appToExport?.type === APP_TYPES.FRONT_END) {
        appToExport['modules'] = moduleApps; //Sending all app related modules
      }
      entitiesToRemoveTimestamps.forEach((entityName) => {
        const entity = appToExport[entityName];
        if (entity) {
          this.removeTimestamps(entity); // Pass the object/array to removeTimestamps
        }
      });
      delete (appToExport as any).updatedAt;
      return { appV2: appToExport };
    });
  }

  async mapModulesForAppImport(
    manager: EntityManager,
    appParams: any,
    user: User,
    externalResourceMappings: any,
    isGitApp: boolean,
    tooljetVersion: string,
    branchId?: string
  ) {
    // ModuleViewer components store STABLE keys in their properties:
    //   properties.moduleAppId.value     = module App.co_relation_id
    //   properties.moduleVersionId.value = AppVersion.name
    // Legacy pre-migration rows may still hold a raw DB id / UUID.
    // The ModuleViewer rewrite sites look up these maps by the stored value,
    // so keys must be STABLE keys. We write dual entries (passport/name
    // primary, raw id legacy fallback) and always store the target's stable
    // key as the value — that's what the resolver's findOne(App, { co_relation_id })
    // expects.
    const moduleAppNames: string[] = [];
    const moduleAppCoRelIds: string[] = [];

    if (appParams?.modules?.length > 0 && appParams?.type === APP_TYPES.FRONT_END) {
      for (const module of appParams.modules) {
        if (module?.appV2?.name) moduleAppNames.push(module.appV2.name);
        if (module?.appV2?.co_relation_id) moduleAppCoRelIds.push(module.appV2.co_relation_id);
      }
    }
    const moduleResourceMappings: {
      moduleApps: Record<string, string>;
      moduleVersions: Record<string, string>;
    } = {
      moduleApps: {},
      moduleVersions: {},
    };

    // Module names live on app_versions.app_name post-migration. Scope the name match
    // to the default branch's BRANCH-type version (the canonical carrier per branch) for
    // git-sync workspaces. Non-git-sync workspaces have no default branch — the lookup
    // falls back to "any version's app_name" since every version row carries the metadata.
    // Workflows are unaffected because modules can never be type=workflow.
    const defaultBranch = await manager.findOne(WorkspaceBranch, {
      where: { organizationId: user.organizationId, isDefault: true },
      select: ['id'],
    });

    const existingModules =
      moduleAppNames.length > 0 || moduleAppCoRelIds.length > 0
        ? await manager
            .createQueryBuilder(App, 'app')
            .where('app.organizationId = :organizationId', { organizationId: user.organizationId })
            .andWhere(
              new Brackets((qb: any) => {
                if (moduleAppNames.length > 0) {
                  if (defaultBranch?.id) {
                    qb.where(
                      `EXISTS (
                         SELECT 1 FROM app_versions av
                         WHERE av.app_id = app.id
                           AND av.branch_id = :defaultBranchId
                           AND av.app_name IN (:...moduleAppNames)
                       )`,
                      { defaultBranchId: defaultBranch.id, moduleAppNames }
                    );
                  } else {
                    // Non-git-sync workspace: no branches. Match against any version's app_name.
                    qb.where(
                      `EXISTS (SELECT 1 FROM app_versions av WHERE av.app_id = app.id AND av.app_name IN (:...moduleAppNames))`,
                      { moduleAppNames }
                    );
                  }
                }
                if (moduleAppCoRelIds.length > 0) {
                  qb.orWhere('app.co_relation_id IN (:...moduleAppCoRelIds)', { moduleAppCoRelIds });
                }
              })
            )
            .distinct(true)
            .getMany()
        : [];

    // Index existing modules by passport first, name as fallback. Resolve each module's
    // canonical name from the same source as the lookup above.
    const existingByCoRel = new Map<string, App>(
      existingModules.filter((m) => m.co_relation_id).map((m) => [m.co_relation_id, m])
    );
    const existingByName = new Map<string, App>();
    if (existingModules.length > 0 && moduleAppNames.length > 0) {
      const nameQb = manager
        .createQueryBuilder(AppVersion, 'av')
        .select(['av.app_id AS app_id', 'av.app_name AS app_name'])
        .where('av.app_id IN (:...appIds)', { appIds: existingModules.map((m) => m.id) })
        .andWhere('av.app_name IN (:...moduleAppNames)', { moduleAppNames });
      if (defaultBranch?.id) {
        nameQb.andWhere('av.branch_id = :defaultBranchId', { defaultBranchId: defaultBranch.id });
      }
      const moduleNameRows: { app_id: string; app_name: string }[] = await nameQb.getRawMany();
      const appById = new Map(existingModules.map((m) => [m.id, m]));
      for (const row of moduleNameRows) {
        const app = appById.get(row.app_id);
        if (app && row.app_name && !existingByName.has(row.app_name)) {
          existingByName.set(row.app_name, app);
        }
      }
    }

    // If consumer is on a non-default branch, we'll need to hydrate a BRANCH-type
    // stub row for each module on that branch so the module appears in the branch's
    // Modules tab (dashboard filters by branch_id). Resolve branch once.
    const targetBranch =
      branchId !== undefined
        ? await manager.findOne(WorkspaceBranch, {
            where: { id: branchId },
            select: ['id', 'isDefault'],
          })
        : null;
    const shouldHydrateBranchStub = !!targetBranch && !targetBranch.isDefault;

    // Collect the target App ids that need a stub row on the consumer's branch.
    const moduleAppIdsForStub: string[] = [];

    // Process each module from the import data
    if (appParams?.modules?.length > 0) {
      // Deduplicate: the export may include the same module once per ModuleViewer
      // component that references it. Keep only the first occurrence keyed by
      // co_relation_id (preferred) or name (fallback).
      const seenModuleKeys = new Set<string>();
      const uniqueModules = appParams.modules.filter((m: any) => {
        const key = m?.appV2?.co_relation_id || m?.appV2?.name;
        if (!key || seenModuleKeys.has(key)) return false;
        seenModuleKeys.add(key);
        return true;
      });

      for (const importedModule of uniqueModules) {
        // Prefer passport match (survives renames and cross-lineage name collisions).
        const existingModule =
          (importedModule?.appV2?.co_relation_id && existingByCoRel.get(importedModule.appV2.co_relation_id)) ||
          existingByName.get(importedModule?.appV2?.name);

        if (existingModule) {
          // Existing module on target — map imported refs to the target's stable keys.
          const targetAppKey = existingModule.co_relation_id ?? existingModule.id;
          if (importedModule?.appV2?.co_relation_id) {
            moduleResourceMappings.moduleApps[importedModule.appV2.co_relation_id] = targetAppKey;
          }
          // Legacy: components that pre-date the passport migration may still
          // hold the source App.id in moduleAppId.value.
          if (importedModule?.appV2?.id) {
            moduleResourceMappings.moduleApps[importedModule.appV2.id] = targetAppKey;
          }
          if (shouldHydrateBranchStub) moduleAppIdsForStub.push(existingModule.id);

          // Fetch existing module's versions to map by name
          const existingVersions = await manager.find(AppVersion, {
            where: { appId: existingModule.id },
            order: { createdAt: 'DESC' },
          });

          const importedModuleVersions = importedModule?.appV2?.appVersions || [];
          const fallbackVersionName = existingVersions[0]?.name;

          for (const importedVersion of importedModuleVersions) {
            const matchingVersion = existingVersions.find((v) => v.name === importedVersion.name);
            const targetVersionName = matchingVersion?.name ?? fallbackVersionName;
            if (!targetVersionName) continue;

            // Name key — matches post-migration components that store a version name.
            if (importedVersion.name) {
              moduleResourceMappings.moduleVersions[importedVersion.name] = targetVersionName;
            }
            // UUID key — matches legacy YAML where moduleVersionId.value is a DB UUID.
            if (importedVersion.id) {
              moduleResourceMappings.moduleVersions[importedVersion.id] = targetVersionName;
            }
          }

          // Also map the editingVersion if not already mapped
          const editingVersion = importedModule?.appV2?.editingVersion;
          if (editingVersion && fallbackVersionName) {
            if (editingVersion.name && !moduleResourceMappings.moduleVersions[editingVersion.name]) {
              moduleResourceMappings.moduleVersions[editingVersion.name] = fallbackVersionName;
            }
            if (editingVersion.id && !moduleResourceMappings.moduleVersions[editingVersion.id]) {
              moduleResourceMappings.moduleVersions[editingVersion.id] = fallbackVersionName;
            }
          }
        } else {
          // Module doesn't exist — import it fresh.
          // For git-sync imports, override the module's slug with a fresh UUID to
          // avoid collisions with the app_versions_default_branch_slug_unique constraint.
          // The source slug (typically the source App.id) is meaningless in the target workspace.
          if (isGitApp && importedModule?.appV2) {
            importedModule.appV2.slug = uuid();
          }

          const { newApp, resourceMapping } = await this.import(
            user,
            importedModule,
            importedModule?.appV2?.name,
            externalResourceMappings,
            isGitApp,
            tooljetVersion,
            false,
            manager,
            branchId
          );

          // For git-sync imports, preserve the source module's co_relation_id so
          // ModuleViewer components (which store moduleAppId.value = co_relation_id)
          // resolve correctly without rewriting. createImportedAppForUser sets
          // co_relation_id = source.id by default, but ModuleViewer references
          // the source's co_relation_id field — overwrite to match.
          if (
            isGitApp &&
            importedModule?.appV2?.co_relation_id &&
            newApp.co_relation_id !== importedModule.appV2.co_relation_id
          ) {
            await manager.update(App, { id: newApp.id }, { co_relation_id: importedModule.appV2.co_relation_id });
            newApp.co_relation_id = importedModule.appV2.co_relation_id;
          }

          // createImportedAppForUser sets new.co_relation_id = source.id. Use
          // the target's co_relation_id as the stable key so consumer
          // components resolve via findOne by co_relation_id.
          const targetAppKey = newApp.co_relation_id ?? newApp.id;
          if (importedModule?.appV2?.co_relation_id) {
            moduleResourceMappings.moduleApps[importedModule.appV2.co_relation_id] = targetAppKey;
          }
          if (importedModule?.appV2?.id) {
            moduleResourceMappings.moduleApps[importedModule.appV2.id] = targetAppKey;
          }
          if (shouldHydrateBranchStub) moduleAppIdsForStub.push(newApp.id);

          // Names are preserved during import, so the target version's name
          // equals the source's name. Write dual keys (name + legacy UUID).
          const importedModuleVersions = importedModule?.appV2?.appVersions || [];
          for (const importedVersion of importedModuleVersions) {
            if (!importedVersion.name) continue;
            if (resourceMapping.appVersionMapping[importedVersion.id]) {
              moduleResourceMappings.moduleVersions[importedVersion.name] = importedVersion.name;
              moduleResourceMappings.moduleVersions[importedVersion.id] = importedVersion.name;
            }
          }
        }
      }
    }

    // Hydrate BRANCH-type stub rows on the consumer's branch for every module
    // the consumer references. Without this, the Modules tab on the consumer's
    // branch won't list these modules (dashboard filters by branch_id). Skips
    // modules that already have a row on this branch.
    if (shouldHydrateBranchStub && moduleAppIdsForStub.length > 0) {
      const stubBranchId = targetBranch.id;
      const uniqueAppIds = Array.from(new Set(moduleAppIdsForStub));

      const existingRows = await manager.find(AppVersion, {
        where: uniqueAppIds.map((appId) => ({ appId, branchId: stubBranchId })),
        select: ['appId'],
      });
      const alreadyOnBranch = new Set(existingRows.map((r) => r.appId));

      // moduleAppIdsForStub holds module app ids only — moduleReferenceId is safe
      // to set unconditionally here.
      for (const appId of uniqueAppIds) {
        if (alreadyOnBranch.has(appId)) continue;
        const stub = manager.create(AppVersion, {
          name: uuid(),
          appId,
          versionType: AppVersionType.BRANCH,
          branchId: stubBranchId,
          isStub: true,
          status: AppVersionStatus.DRAFT,
          definition: {},
          globalSettings: {},
          pageSettings: {},
          showViewerNavigation: false,
          moduleReferenceId: uuid(),
        } as DeepPartial<AppVersion>);
        await manager.save(AppVersion, stub);
      }
    }

    return moduleResourceMappings;
  }

  removeTimestamps = (entity: any) => {
    if (Array.isArray(entity)) {
      entity.forEach((item) => {
        delete item.createdAt;
        delete item.updatedAt;
      });
    } else if (entity && typeof entity === 'object') {
      delete entity.createdAt;
      delete entity.updatedAt;
    }
  };
  async import(
    user: User,
    appParamsObj: any,
    appName: string,
    externalResourceMappings = {},
    isGitApp = false,
    tooljetVersion = '',
    cloning = false,
    manager?: EntityManager,
    branchId?: string
  ): Promise<{ newApp: App; resourceMapping: AppResourceMappings }> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      if (typeof appParamsObj !== 'object') {
        throw new BadRequestException('Invalid params for app import');
      }
      let appParams = appParamsObj;

      if (appParams?.appV2) {
        appParams = { ...appParams.appV2 };
      }

      // appParams.name can be null when the file was exported from a git-enabled
      // workspace where the module only exists on a feature branch (no default-branch
      // DRAFT version → resolveMetadataVersion returns null → app.name stays null).
      // appName (user-provided) is always used as the final name (line below), so
      // allow it as a fallback here to avoid a spurious 400 on device imports.
      if (!appParams?.name && !appName) {
        throw new BadRequestException('Invalid params for app import');
      }

      const moduleResourceMappings = await this.mapModulesForAppImport(
        manager,
        appParams,
        user,
        externalResourceMappings,
        isGitApp,
        tooljetVersion,
        branchId
      );

      const schemaUnifiedAppParams = appParams?.schemaDetails?.multiPages
        ? appParams
        : convertSinglePageSchemaToMultiPageSchema(appParams);
      schemaUnifiedAppParams.name = appName;

      const importedAppTooljetVersion = !cloning && extractMajorVersion(tooljetVersion);
      const isNormalizedAppDefinitionSchema = cloning
        ? true
        : isTooljetVersionWithNormalizedAppDefinitionSchem(importedAppTooljetVersion);

      const currentTooljetVersion = !cloning ? tooljetVersion : null;
      const existingAppId = appParamsObj.existingAppId;
      const importedApp = await this.createImportedAppForUser(
        manager,
        schemaUnifiedAppParams,
        user,
        isGitApp,
        existingAppId
      );

      const resourceMapping = await this.setupImportedAppAssociations(
        manager,
        importedApp,
        schemaUnifiedAppParams,
        user,
        externalResourceMappings,
        isNormalizedAppDefinitionSchema,
        currentTooljetVersion,
        moduleResourceMappings,
        undefined,
        branchId,
        cloning,
        isGitApp
      );
      await this.updateEntityReferencesForImportedApp(manager, resourceMapping, isGitApp);

      // Update latest version as editing version
      const { importingAppVersions } = this.extractImportDataFromAppParams(appParams);

      // When multiple versions are imported, branch-type versions are excluded.
      // Filter here to match so the editing version is set to a version that was actually created.
      const importedAppVersions =
        importingAppVersions.length > 1
          ? importingAppVersions.filter((v: any) => !v.versionType || v.versionType === AppVersionType.VERSION)
          : importingAppVersions;

      await this.setEditingVersionAsLatestVersion(manager, resourceMapping.appVersionMapping, importedAppVersions);

      // NOTE: App slug updation callback doesn't work while wrapped in transaction
      // hence updating slug explicitly. Only workflows carry slug on apps.* —
      // non-workflows keep apps.slug NULL (the real slug lives on app_versions).
      const newApp = await manager.findOne(App, {
        where: { id: importedApp.id },
      });
      if (newApp.type === APP_TYPES.WORKFLOW) {
        newApp.slug = importedApp.slug || importedApp.id;
        await manager.save(newApp);
      }
      return { newApp, resourceMapping };
    }, manager);
  }

  /**
   * Sets co_relation_id on an entity based on the mapping (oldId -> newId)
   * Finds the old ID (key) that maps to the entity's current ID (value)
   */
  private setCoRelationId<T extends { id: string; co_relation_id?: string }>(
    entity: T,
    mapping: Record<string, string>
  ): void {
    const co_relation_id = Object.keys(mapping).find((key) => mapping[key] === entity.id);
    if (co_relation_id) {
      entity.co_relation_id = co_relation_id;
    }
  }

  private async updateCoRelationIdsForEntities(
    manager: EntityManager,
    resourceMapping: AppResourceMappings
  ): Promise<void> {
    const newPageIds = Object.values(resourceMapping.pagesMapping);
    const newDataSourceIds = Object.values(resourceMapping.dataSourceMapping);
    const newDsoIds = Object.values(resourceMapping.dataSourceOptionsMapping);
    const newLayoutIds = Object.values(resourceMapping.layoutMapping);

    // Pages
    if (newPageIds.length > 0) {
      const pages = await manager
        .createQueryBuilder(Page, 'pages')
        .where('pages.id IN(:...pageIds)', { pageIds: newPageIds })
        .select(['pages.id'])
        .getMany();

      const toUpdatePages = pages.map((page) => {
        this.setCoRelationId(page, resourceMapping.pagesMapping);
        return page;
      });

      if (!isEmpty(toUpdatePages)) {
        await manager.save(toUpdatePages);
      }
    }

    // DataSources
    if (newDataSourceIds.length > 0) {
      const dataSources = await manager
        .createQueryBuilder(DataSource, 'dataSources')
        .where('dataSources.id IN(:...dataSourceIds)', { dataSourceIds: newDataSourceIds })
        .select(['dataSources.id'])
        .getMany();

      const toUpdateDataSources = dataSources.map((dataSource) => {
        this.setCoRelationId(dataSource, resourceMapping.dataSourceMapping);
        return dataSource;
      });

      if (!isEmpty(toUpdateDataSources)) {
        await manager.save(toUpdateDataSources);
      }
    }

    // DataSourceOptions (now stored in DataSourceVersionOptions)
    if (newDsoIds.length > 0) {
      const dataSourceOptions = await manager
        .createQueryBuilder(DataSourceVersionOptions, 'dso')
        .where('dso.id IN(:...dsoIds)', { dsoIds: newDsoIds })
        .select(['dso.id'])
        .getMany();

      const toUpdateDso = dataSourceOptions.map((dso) => {
        this.setCoRelationId(dso, resourceMapping.dataSourceOptionsMapping);
        return dso;
      });

      if (!isEmpty(toUpdateDso)) {
        await manager.save(toUpdateDso);
      }
    }

    // Layouts
    if (newLayoutIds.length > 0) {
      const layouts = await manager
        .createQueryBuilder(Layout, 'layouts')
        .where('layouts.id IN(:...layoutIds)', { layoutIds: newLayoutIds })
        .select(['layouts.id'])
        .getMany();

      const toUpdateLayouts = layouts.map((layout) => {
        this.setCoRelationId(layout, resourceMapping.layoutMapping);
        return layout;
      });

      if (!isEmpty(toUpdateLayouts)) {
        await manager.save(toUpdateLayouts);
      }
    }

    // AppVersion.co_relation_id is intentionally NOT updated here.
    // It is set at creation time from appVersion.id in the imported JSON —
    // in git, id IS the co_relation_id (ids are swapped with co_relation_ids on push).
  }

  async updateEntityReferencesForImportedApp(
    manager: EntityManager,
    resourceMapping: AppResourceMappings,
    updateCoRelationIds = false
  ) {
    const mappings = {
      ...resourceMapping.componentsMapping,
      ...resourceMapping.dataQueryMapping,
      ...resourceMapping.pagesMapping,
      ...resourceMapping.dataSourceMapping,
      ...resourceMapping.dataSourceOptionsMapping,
      ...resourceMapping.layoutMapping,
      ...resourceMapping.appVersionMapping,
    };
    const newComponentIds = Object.values(resourceMapping.componentsMapping);
    const newQueriesIds = Object.values(resourceMapping.dataQueryMapping);
    const appVersionIds = Object.values(resourceMapping.appVersionMapping);

    if (newComponentIds.length > 0) {
      const components = await manager
        .createQueryBuilder(Component, 'components')
        .where('components.id IN(:...componentIds)', {
          componentIds: newComponentIds,
        })
        .select([
          'components.id',
          'components.properties',
          'components.styles',
          'components.general',
          'components.validation',
          'components.generalStyles',
          'components.displayPreferences',
        ])
        .getMany();

      let toUpdateComponents;
      if (updateCoRelationIds) {
        toUpdateComponents = components.map((component) => {
          const co_relation_id = Object.keys(resourceMapping.componentsMapping).find(
            (key) => resourceMapping.componentsMapping[key] === component.id
          );
          if (co_relation_id) {
            component.co_relation_id = co_relation_id; // Set the coRelationId
          }
          // FlexContainer childOrder holds raw child ids (not a {{...}} binding), so it must be
          // remapped explicitly on import/export — same gap as draft/version copy (issue #5153).
          remapFlexContainerChildOrder(component, resourceMapping.componentsMapping);
          updateEntityReferences(component, mappings);
          return component;
        });
      } else {
        toUpdateComponents = components.filter((component) => {
          // FlexContainer childOrder holds raw child ids (not a {{...}} binding), so it must be
          // remapped explicitly on import/export — same gap as draft/version copy (issue #5153).
          remapFlexContainerChildOrder(component, resourceMapping.componentsMapping);
          return updateEntityReferences(component, mappings);
        });
      }

      if (!isEmpty(toUpdateComponents)) {
        await manager.save(toUpdateComponents);
      }
    }

    if (newQueriesIds.length > 0) {
      const dataQueries = await manager
        .createQueryBuilder(DataQuery, 'dataQueries')
        .where('dataQueries.id IN(:...dataQueryIds)', {
          dataQueryIds: newQueriesIds,
        })
        .select(['dataQueries.id', 'dataQueries.options'])
        .getMany();

      let toUpdateDataQueries;
      if (updateCoRelationIds) {
        toUpdateDataQueries = dataQueries.filter((dataQuery) => {
          const oldId = Object.keys(resourceMapping.dataQueryMapping).find(
            (key) => resourceMapping.dataQueryMapping[key] === dataQuery.id
          );
          if (oldId) {
            dataQuery.co_relation_id = oldId; // Set the coRelationId to the old ID
          }
          return updateEntityReferences(dataQuery, mappings);
        });
      } else {
        toUpdateDataQueries = dataQueries.filter((dataQuery) => {
          return updateEntityReferences(dataQuery, mappings);
        });
      }

      if (!isEmpty(toUpdateDataQueries)) {
        await manager.save(toUpdateDataQueries);
      }
    }

    // Handle co_relation_id for Pages, DataSources, DataSourceOptions, Layouts (only when updateCoRelationIds is true)
    if (updateCoRelationIds) {
      await this.updateCoRelationIdsForEntities(manager, resourceMapping);
    }

    // update Global settings of created versions
    const newAppVersions = await manager.find(AppVersion, {
      where: {
        id: In(appVersionIds),
      },
      select: ['id', 'globalSettings'],
    });
    for (const appVersion of newAppVersions) {
      if (appVersion.globalSettings) {
        const updatedGlobalSettings = updateEntityReferences(appVersion.globalSettings, mappings);
        await manager.update(AppVersion, { id: appVersion.id }, { globalSettings: updatedGlobalSettings });
      }
    }

    if (appVersionIds.length > 0) {
      await this.updateWorkflowDefinitionQueryReferences(manager, appVersionIds, resourceMapping);
    }
  }

  async createImportedAppForUser(
    //Overrides on EE to set userId to super admin's id
    manager: EntityManager,
    appParams: any,
    user: User,
    isGitApp = false,
    existingAppId?
  ): Promise<App> {
    return await catchDbException(async () => {
      const isWorkflow = appParams?.type === APP_TYPES.WORKFLOW;

      // Non-workflows store the user-facing name on app_versions.app_name and apps.name
      // stays NULL — so the table-level APP_NAME_UNIQUE constraint doesn't catch cross-app
      // collisions. Scoped to git-disabled workspaces only: git-enabled workspaces enforce
      // uniqueness via the partial unique index on (app_name, branch_id) WHERE
      // version_type='branch'.
      if (!isWorkflow && appParams?.name) {
        const defaultBranch = await manager.findOne(WorkspaceBranch, {
          where: { organizationId: user?.organizationId, isDefault: true },
          select: ['id'],
        });
        if (!defaultBranch) {
          const conflictingNameVersion = await manager
            .createQueryBuilder(AppVersion, 'av')
            .innerJoin(App, 'app', 'app.id = av.appId')
            .where('av.app_name = :appName', { appName: appParams.name })
            .andWhere('av.branch_id IS NULL')
            .andWhere('av.version_type = :versionType', { versionType: AppVersionType.VERSION })
            .andWhere('app.organization_id = :organizationId', { organizationId: user?.organizationId })
            .getOne();
          if (conflictingNameVersion) {
            throw new BadRequestException('This app name is already taken.');
          }
        }
      }

      const appId = uuid();
      // Workflows still carry name/slug/icon/isPublic on apps.*; non-workflow metadata
      // lives on app_versions. apps.slug stays NULL for non-workflows — Postgres allows
      // multiple NULLs on a UNIQUE column so this doesn't violate uniqueness.
      const importedApp = manager.create(App, {
        id: appId,
        name: isWorkflow ? appParams.name : null,
        type: appParams.type || APP_TYPES.FRONT_END,
        isMaintenanceOn: appParams.isMaintenanceOn || false,
        organizationId: user?.organizationId,
        userId: user.id, //fetch super admin user id for EE
        slug: null,
        icon: isWorkflow ? appParams.icon : null,
        creationMode: `${isGitApp ? 'GIT' : 'DEFAULT'}`,
        isPublic: isWorkflow ? false : null,
        co_relation_id: appParams?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await manager.save(importedApp);

      // Stage metadata for downstream (createAppVersionsForImportedApp,
      // performLegacyAppImport) so they can write it to app_versions.
      if (!isWorkflow) {
        (importedApp as any).__importMetadata = {
          appName: appParams.name || null,
          icon: appParams.icon || null,
          isPublic: appParams.isPublic ?? false,
        };
      }

      return importedApp;
    }, [
      {
        dbConstraint: DataBaseConstraints.APP_NAME_UNIQUE,
        message: 'This app name is already taken.',
      },
      {
        dbConstraint: DataBaseConstraints.APP_VERSION_APP_NAME_BRANCH_UNIQUE,
        message: 'This app name is already taken.',
      },
    ]);
  }

  extractImportDataFromAppParams(appParams: Record<string, any>): {
    importingDataSources: DataSource[];
    importingDataQueries: DataQuery[];
    importingAppVersions: AppVersion[];
    importingAppEnvironments: AppEnvironment[];
    importingDataSourceOptions: any[];
    importingDefaultAppEnvironmentId: string;
    importingPages: Page[];
    importingComponents: Component[];
    importingEvents: EventHandler[];
    importingDataQueryFolders: DataQueryFolder[];
    importingDataQueryFolderMappings: DataQueryFolderMapping[];
  } {
    const importingDataSources = appParams?.dataSources || [];
    const importingDataQueries = appParams?.dataQueries || [];
    const importingAppVersions = appParams?.appVersions || [];
    const importingAppEnvironments = appParams?.appEnvironments || [];
    const importingDataSourceOptions = appParams?.dataSourceOptions || [];
    const importingDefaultAppEnvironmentId = importingAppEnvironments.find(
      (env: { isDefault: any }) => env.isDefault
    )?.id;

    const importingPages = appParams?.pages || [];
    const importingComponents = appParams?.components || [];
    const importingEvents = appParams?.events || [];
    const importingDataQueryFolders = appParams?.dataQueryFolders || [];
    const importingDataQueryFolderMappings = appParams?.dataQueryFolderMappings || [];

    return {
      importingDataSources,
      importingDataQueries,
      importingAppVersions,
      importingAppEnvironments,
      importingDataSourceOptions,
      importingDefaultAppEnvironmentId,
      importingPages,
      importingComponents,
      importingEvents,
      importingDataQueryFolders,
      importingDataQueryFolderMappings,
    };
  }

  /*
   * With new multi-env changes. the imported apps will not have any released versions from now (if the importing schema has any currentVersionId).
   * All version's default environment will be development or least priority environment only.
   */
  async setupImportedAppAssociations(
    manager: EntityManager,
    importedApp: App,
    appParams: any,
    user: User,
    externalResourceMappings: Record<string, unknown>,
    isNormalizedAppDefinitionSchema: boolean,
    tooljetVersion: string | null,
    moduleResourceMappings?: Record<string, unknown>,
    createNewVersion?: boolean,
    branchId?: string,
    cloning = false,
    isGitApp = false
  ): Promise<AppResourceMappings> {
    // Old version without app version
    // Handle exports prior to 0.12.0
    // TODO: have version based conditional based on app versions
    // isLessThanExportVersion(appParams.tooljet_version, 'v0.12.0')
    if (!appParams?.appVersions) {
      await this.performLegacyAppImport(manager, importedApp, appParams, externalResourceMappings, user);
      return;
    }

    let appResourceMappings: AppResourceMappings = {
      defaultDataSourceIdMapping: {},
      dataQueryMapping: {},
      appVersionMapping: {},
      appEnvironmentMapping: {},
      appDefaultEnvironmentMapping: {},
      pagesMapping: {},
      componentsMapping: {},
      dataSourceMapping: {},
      dataSourceOptionsMapping: {},
      layoutMapping: {},
      versionGitIdMapping: {},
    };
    const {
      importingDataSources,
      importingDataQueries,
      importingAppVersions,
      importingAppEnvironments,
      importingDataSourceOptions,
      importingDefaultAppEnvironmentId,
      importingPages,
      importingComponents,
      importingEvents,
      importingDataQueryFolders,
      importingDataQueryFolderMappings,
    } = this.extractImportDataFromAppParams(appParams);

    // When importing multiple versions, skip branch-type versions — only import regular versions.
    // When importing a single branch-type version, allow it through (it will be adapted to
    // the target branch context inside createAppVersionsForImportedApp).
    // const filteredAppVersions =
    //   importingAppVersions.length > 1
    //     ? importingAppVersions.filter((v: any) => !v.versionType || v.versionType === AppVersionType.VERSION)
    //     : importingAppVersions;

    // When importing multiple versions, select the right versions to import based on context:
    // - Cloning on a sub-branch (cloning=true, branchId provided): prefer non-stub BRANCH-type
    //   versions matching the source branchId. Fall back to VERSION-type if none found.
    // - Git hydrate (isGitApp + branchId): pass all (pull.service.ts re-parents).
    // - File import onto a sub-branch (!isGitApp + !cloning + branchId): keep ONLY
    //   the latest version. Sub-branches have a single editable BRANCH-type DRAFT —
    //   importing history would create rows the sub-branch can't represent. Older
    //   versions in the JSON are dropped.
    // - All other cases (file import without branch): skip BRANCH-type versions,
    //   only import VERSION-type.
    // - Single version: allow through as-is (will be adapted in createAppVersionsForImportedApp).
    let filteredAppVersions: any[];
    if (importingAppVersions.length > 1) {
      if (cloning && branchId) {
        const nonStubBranchVersions = importingAppVersions.filter(
          (v: any) => v.versionType === AppVersionType.BRANCH && v.branchId === branchId && !v.isStub
        );
        filteredAppVersions =
          nonStubBranchVersions.length > 0
            ? nonStubBranchVersions
            : importingAppVersions.filter((v: any) => !v.versionType || v.versionType === AppVersionType.VERSION);
      } else if (isGitApp && branchId) {
        // Hydrate path: the git folder being imported already represents one branch's
        // snapshot. Every version file in it belongs here regardless of versionType /
        // stored branchId — pull.service.ts re-parents and rewrites versionType, name,
        // branchId on the imported row anyway. Stripping BRANCH-type versions here
        // (the original cross-workspace-import rule) leaves zero versions and crashes
        // hydration with "No versions found after import".
        filteredAppVersions = importingAppVersions;
      } else if (!isGitApp && !cloning && branchId) {
        // File import onto a sub-branch — keep only the latest version. Older
        // versions are dropped (sub-branches carry one editable DRAFT, no history).
        const latest = this.pickLatestVersionFromImport(importingAppVersions);
        filteredAppVersions = latest ? [latest] : [];
      } else {
        filteredAppVersions = importingAppVersions.filter(
          (v: any) => !v.versionType || v.versionType === AppVersionType.VERSION
        );
      }
    } else {
      filteredAppVersions = importingAppVersions;
    }

    const { appDefaultEnvironmentMapping, appVersionMapping } = await this.createAppVersionsForImportedApp(
      manager,
      user,
      importedApp,
      filteredAppVersions,
      appResourceMappings,
      isNormalizedAppDefinitionSchema,
      createNewVersion,
      branchId,
      isGitApp || cloning || !!branchId
    );
    appResourceMappings.appDefaultEnvironmentMapping = appDefaultEnvironmentMapping;
    appResourceMappings.appVersionMapping = appVersionMapping;

    /**
     * as multiple operations are run within a single transaction using  the transaction method provides a convenient way to handle transactions.
     *  The transaction will automatically committed when the function completes without throwing an error.
     * If an error occurs during the function execution, the transaction will rolled back.
     */

    appResourceMappings = await this.setupAppVersionAssociations(
      manager,
      filteredAppVersions,
      user,
      appResourceMappings,
      externalResourceMappings,
      importingAppEnvironments,
      importingDataSources,
      importingDataSourceOptions,
      importingDataQueries,
      importingDefaultAppEnvironmentId,
      importingPages,
      importingComponents,
      importingEvents,
      tooljetVersion,
      moduleResourceMappings,
      importingDataQueryFolders,
      importingDataQueryFolderMappings,
      branchId,
      isGitApp
    );

    const importedAppVersionIds = Object.values(appResourceMappings.appVersionMapping);
    if (importedAppVersionIds.length > 0) {
      await applyPageSettingsMigration(manager, importedAppVersionIds);
    }

    if (!isNormalizedAppDefinitionSchema) {
      for (const importingAppVersion of filteredAppVersions) {
        const updatedDefinition: DeepPartial<any> = this.replaceDataQueryIdWithinDefinitions(
          importingAppVersion.definition,
          appResourceMappings.dataQueryMapping
        );

        let updateHomepageId = null;

        if (updatedDefinition?.pages) {
          for (const pageId of Object.keys(updatedDefinition?.pages)) {
            const page = updatedDefinition.pages[pageId];

            const pageEvents = page.events || [];
            const componentEvents = [];

            const pagePostionIntheList = Object.keys(updatedDefinition?.pages).indexOf(pageId);

            const isHompage = (updatedDefinition['homePageId'] as any) === pageId;

            const pageComponents = page.components;

            const mappedComponents = transformComponentData(
              pageComponents,
              componentEvents,
              appResourceMappings.componentsMapping,
              isNormalizedAppDefinitionSchema,
              tooljetVersion,
              moduleResourceMappings,
              undefined,
              isGitApp
            );

            const componentLayouts = [];

            const newPage = manager.create(Page, {
              name: page.name,
              handle: page.handle,
              appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
              index: pagePostionIntheList,
              disabled: page.disabled || false,
              hidden: page.hidden || false,
              pageHeader: page.pageHeader || {
                showOnDesktop: false,
                showOnMobile: false,
                backgroundColor: 'var(--cc-surface1-surface)',
                border: 'var(--cc-weak-border)',
                height: 60,
              },
              pageFooter: page.pageFooter || {
                showOnDesktop: false,
                showOnMobile: false,
                backgroundColor: 'var(--cc-surface1-surface)',
                border: 'var(--cc-weak-border)',
                height: 60,
              },
              autoComputeLayout: page.autoComputeLayout || false,
              isPageGroup: page.isPageGroup,
              pageGroupIndex: page.pageGroupIndex || null,
              icon: page.icon || null,
            });
            const pageCreated = await manager.save(newPage);

            appResourceMappings.pagesMapping[pageId] = pageCreated.id;

            mappedComponents.forEach((component) => {
              component.page = pageCreated;
            });

            const savedComponents = await manager.save(Component, mappedComponents);

            const layoutIdToOldIdMap: { layout: Layout; oldId: string }[] = [];

            for (const componentId in pageComponents) {
              const componentLayout = pageComponents[componentId]['layouts'];
              const sortedLayoutTypes = Object.keys(componentLayout).sort((a, b) => {
                return componentLayout[a].id.localeCompare(componentLayout[b].id);
              });

              if (componentLayout && appResourceMappings.componentsMapping[componentId]) {
                for (const type of sortedLayoutTypes) {
                  const layout = componentLayout[type];
                  const newLayout = new Layout();
                  newLayout.type = type;
                  newLayout.top = layout.top;
                  newLayout.left =
                    layout.dimensionUnit !== LayoutDimensionUnits.COUNT
                      ? this.componentsService.resolveGridPositionForComponent(layout.left, type)
                      : layout.left;
                  newLayout.dimensionUnit = LayoutDimensionUnits.COUNT;
                  newLayout.width = layout.width;
                  newLayout.height = layout.height;
                  if (layout.widthPx != null) newLayout.widthPx = layout.widthPx;
                  if (layout.fillWidth != null) newLayout.fillWidth = layout.fillWidth;
                  newLayout.componentId = appResourceMappings.componentsMapping[componentId];

                  componentLayouts.push(newLayout);
                  layoutIdToOldIdMap.push({ layout: newLayout, oldId: layout.id });
                }
              }
            }

            // await manager.save(Layout, componentLayouts);

            const savedLayouts = await manager.save(Layout, componentLayouts);
            // Populate layoutMapping: oldId -> newId
            savedLayouts.forEach((savedLayout, index) => {
              const oldId = layoutIdToOldIdMap[index].oldId;
              if (oldId) {
                appResourceMappings.layoutMapping[oldId] = savedLayout.id;
              }
            });

            //Event handlers

            if (pageEvents.length > 0) {
              await Promise.all(
                pageEvents.map(async (event, index) => {
                  const newEvent = {
                    name: this.getEventHandlerName(event),
                    sourceId: pageCreated.id,
                    target: Target.page,
                    event: event,
                    index: pageEvents.index || index,
                    appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                  };

                  await manager.save(EventHandler, newEvent);
                })
              );
            }

            await Promise.all(
              componentEvents.map(async (eventObj) => {
                if (eventObj.event?.length === 0) return;

                await Promise.all(
                  eventObj.event.map(async (event, index) => {
                    const newEvent = manager.create(EventHandler, {
                      name: this.getEventHandlerName(event),
                      sourceId: appResourceMappings.componentsMapping[eventObj.componentId],
                      target: Target.component,
                      event: event,
                      index: eventObj.index || index,
                      appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                    });

                    await manager.save(EventHandler, newEvent);
                  })
                );
              })
            );

            await Promise.all(
              savedComponents.map(async (component) => {
                if (component.type === 'Table') {
                  const tableActions = component.properties?.actions?.value || [];
                  const tableColumns = component.properties?.columns?.value || [];

                  const tableActionAndColumnEvents = [];

                  tableActions.forEach((action) => {
                    const actionEvents = action.events || [];

                    actionEvents.forEach((event, index) => {
                      tableActionAndColumnEvents.push({
                        name: this.getEventHandlerName(event),
                        sourceId: component.id,
                        target: Target.tableAction,
                        event: { ...event, ref: action.name },
                        index: event.index ?? index,
                        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                      });
                    });
                  });

                  tableColumns.forEach((column) => {
                    if (column?.columnType !== 'toggle') return;
                    const columnEvents = column.events || [];

                    columnEvents.forEach((event, index) => {
                      tableActionAndColumnEvents.push({
                        name: this.getEventHandlerName(event),
                        sourceId: component.id,
                        target: Target.tableColumn,
                        event: { ...event, ref: column.name },
                        index: event.index ?? index,
                        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                      });
                    });
                  });

                  await manager.save(EventHandler, tableActionAndColumnEvents);
                }
              })
            );

            if (isHompage) {
              updateHomepageId = pageCreated.id;
            }
          }
        }

        await manager.update(
          AppVersion,
          { id: appResourceMappings.appVersionMapping[importingAppVersion.id] },
          {
            definition: updatedDefinition,
            homePageId: updateHomepageId,
          }
        );
      }
    }

    const appVersionIds = Object.values(appResourceMappings.appVersionMapping);

    for (const appVersionId of appVersionIds) {
      await this.updateEventActionsForNewVersionWithNewMappingIds(
        manager,
        appVersionId,
        appResourceMappings.dataQueryMapping,
        appResourceMappings.componentsMapping,
        appResourceMappings.pagesMapping
      );
    }

    return appResourceMappings;
  }

  async setupAppVersionAssociations(
    manager: EntityManager,
    importingAppVersions: AppVersion[],
    user: User,
    appResourceMappings: AppResourceMappings,
    externalResourceMappings: Record<string, unknown>,
    importingAppEnvironments: AppEnvironment[],
    importingDataSources: DataSource[],
    importingDataSourceOptions: any[],
    importingDataQueries: DataQuery[],
    importingDefaultAppEnvironmentId: string,
    importingPages: Page[],
    importingComponents: Component[],
    importingEvents: EventHandler[],
    tooljetVersion: string | null,
    moduleResourceMappings?: any,
    importingDataQueryFolders: DataQueryFolder[] = [],
    importingDataQueryFolderMappings: DataQueryFolderMapping[] = [],
    branchId?: string,
    isGitApp = false
  ): Promise<AppResourceMappings> {
    appResourceMappings = { ...appResourceMappings };

    // Dedupe key for folder mappings across ALL version iterations.
    // The DB enforces UNIQUE(child_id, child_type). In git exports, queries are cloned
    // across versions with a shared co_relation_id (gitId), so the mappings file-set
    // can contain N mappings that all reference the same query child. Without dedupe
    // we'd attempt N inserts per child and violate the unique constraint on the 2nd.
    const insertedMappingChildKeys = new Set<string>();

    for (const importingAppVersion of importingAppVersions) {
      let isHomePage = false;
      let updateHomepageId = null;

      const { appEnvironmentMapping } = await this.associateAppEnvironmentsToAppVersion(
        manager,
        user,
        importingAppEnvironments,
        importingAppVersion,
        appResourceMappings
      );
      appResourceMappings.appEnvironmentMapping = appEnvironmentMapping;

      const { defaultDataSourceIdMapping } = await this.createDefaultDatasourcesForAppVersion(
        manager,
        importingAppVersion,
        user,
        appResourceMappings
      );
      appResourceMappings.defaultDataSourceIdMapping = defaultDataSourceIdMapping;

      const importingDataSourcesForAppVersion = await this.rejectMarketplacePluginsNotInstalled(
        manager,
        importingDataSources
      );

      const importingDataQueriesForAppVersion = importingDataQueries.filter(
        (dq: { dataSourceId: string; appVersionId: string }) => dq.appVersionId === importingAppVersion.id
      );

      // Normalize old-format DSO dataSourceIds before the DS loop.
      // Old git exports wrote the original workspace UUID in dso.dataSourceId instead of
      // the DS's co_relation_id. At import time importingDataSource.id = co_relation_id,
      // so the filter (dso.dataSourceId === importingDataSource.id) never matches →
      // createDatasourceOption never called → all fields (encrypted + non-encrypted) empty.
      //
      // Strategy: find DSO groups whose dataSourceId doesn't match any importing DS id
      // (orphans), find importing DSes that have no matched DSOs (unmatched), and remap
      // by position when counts are equal. Reliable for single-DS apps; best-effort for
      // multi-DS apps where export preserved the DS / DSO group order.
      const dsIdSet = new Set(importingDataSourcesForAppVersion.map((ds: DataSource) => ds.id));
      const orphanedDsoDataSourceIds = [
        ...new Set(
          importingDataSourceOptions
            .filter((dso: any) => !dsIdSet.has(dso.dataSourceId))
            .map((dso: any) => dso.dataSourceId as string)
        ),
      ];
      const unmatchedImportingDs = importingDataSourcesForAppVersion.filter(
        (ds: DataSource) => !importingDataSourceOptions.some((dso: any) => dso.dataSourceId === ds.id)
      );
      if (orphanedDsoDataSourceIds.length > 0 && orphanedDsoDataSourceIds.length === unmatchedImportingDs.length) {
        orphanedDsoDataSourceIds.forEach((oldDsId, idx) => {
          const targetId = unmatchedImportingDs[idx].id;
          for (const dso of importingDataSourceOptions) {
            if (dso.dataSourceId === oldDsId) {
              dso.dataSourceId = targetId;
            }
          }
        });
      }

      // associate data sources and queries for each of the app versions
      for (const importingDataSource of importingDataSourcesForAppVersion) {
        const dataSourceForAppVersion = await this.findOrCreateDataSourceForAppVersion(
          manager,
          importingDataSource,
          user,
          isGitApp,
          branchId
        );

        appResourceMappings.dataSourceMapping[importingDataSource.id] = dataSourceForAppVersion.id;

        // TODO: Have version based conditional based on app versions
        // currently we are checking on existence of keys and handling
        // imports accordingly. Would be pragmatic to do:
        // isLessThanExportVersion(appParams.tooljet_version, 'v2.0.0')
        // Will need to have JSON schema setup for each versions
        if (importingDataSource.options) {
          const convertedOptions = this.convertToArrayOfKeyValuePairs(importingDataSource.options);

          await Promise.all(
            appResourceMappings.appDefaultEnvironmentMapping[importingAppVersion.id].map(async (envId: any) => {
              if (this.isExistingDataSource(dataSourceForAppVersion)) return;

              const newOptions = await this.dataSourcesUtilService.parseOptionsForCreate(
                convertedOptions,
                true,
                manager
              );
              // Find-or-create default DSV, then create DSVO
              let defaultDsv = await manager.findOne(DataSourceVersion, {
                where: { dataSourceId: dataSourceForAppVersion.id, isDefault: true },
              });
              if (!defaultDsv) {
                defaultDsv = await manager.save(
                  manager.create(DataSourceVersion, {
                    dataSourceId: dataSourceForAppVersion.id,
                    name: dataSourceForAppVersion.name || importingDataSource.name || 'v1',
                    isDefault: true,
                    isActive: true,
                    branchId: null,
                  })
                );
              }
              const existingDsvo = await manager.findOne(DataSourceVersionOptions, {
                where: { dataSourceVersionId: defaultDsv.id, environmentId: envId },
              });
              let savedDsvo;
              if (!existingDsvo) {
                savedDsvo = await manager.save(
                  manager.create(DataSourceVersionOptions, {
                    dataSourceVersionId: defaultDsv.id,
                    environmentId: envId,
                    options: newOptions,
                  })
                );
              } else {
                savedDsvo = existingDsvo;
              }

              // Find the matching old dataSourceOption ID for this environment
              const oldDsOption = importingDataSourceOptions.find(
                (dso) => dso.dataSourceId === importingDataSource.id && dso.environmentId === envId
              );
              if (oldDsOption) {
                appResourceMappings.dataSourceOptionsMapping[oldDsOption.id] = savedDsvo.id;
              }
            })
          );
        }

        const isDefaultDatasource = DefaultDataSourceNames.includes(importingDataSource.name as DefaultDataSourceName);
        // Skip per-app DSO backfill for git apps — workspace-level pull
        // (deserializeDataSources) and ensureDummyDataSources already create
        // the DSV + per-env DSVO rows. Running this here with empty
        // importingDataSourceOptions would crash on `defaultEnvDsOption.options`.
        if (!isDefaultDatasource && !isGitApp) {
          await this.createDataSourceOptionsForExistingAppEnvs(
            manager,
            importingAppVersion,
            dataSourceForAppVersion,
            importingDataSourceOptions,
            importingDataSource,
            importingAppEnvironments,
            appResourceMappings,
            importingDefaultAppEnvironmentId
          );
        }

        // Ensure branch-scoped DSV exists so the DS appears on the global DS page
        // for the active branch. This handles both newly created and existing DS.
        if (!isDefaultDatasource) {
          await this.ensureBranchDsvForDataSource(manager, dataSourceForAppVersion, user.organizationId, branchId);
        }

        const { dataQueryMapping } = await this.createDataQueriesForAppVersion(
          manager,
          user?.organizationId,
          importingDataQueriesForAppVersion,
          importingDataSource,
          dataSourceForAppVersion,
          importingAppVersion,
          appResourceMappings,
          externalResourceMappings
        );
        appResourceMappings.dataQueryMapping = dataQueryMapping;
      }

      // Import query folders and their mappings for this app version.
      // Dedupe by name because all versions of an app share the same co_relation_id
      // (see versions/util.service.ts — versions inherit app.co_relation_id). On git
      // export every folder's appVersionId is rewritten to that shared gitId, so the
      // foldersForVersion filter matches one row per (version × folder name) combo.
      // Collapsing by name yields exactly one folder per logical name on the active
      // version. folderIdMapping still maps every source folder.id to the surviving
      // local folder so cross-version mapping rows resolve correctly.
      const newAppVersionId = appResourceMappings.appVersionMapping[importingAppVersion.id];
      const foldersForVersion = importingDataQueryFolders.filter((f) => f.appVersionId === importingAppVersion.id);
      const folderIdMapping: Record<string, string> = {};
      const nameToSavedFolderId: Record<string, string> = {};

      for (const folder of foldersForVersion) {
        let savedId = nameToSavedFolderId[folder.name];
        if (!savedId) {
          const newFolder = manager.create(DataQueryFolder, {
            name: folder.name,
            appVersionId: newAppVersionId,
            co_relation_id: folder.id,
          });
          const savedFolder = await manager.save(DataQueryFolder, newFolder);
          savedId = savedFolder.id;
          nameToSavedFolderId[folder.name] = savedId;
        }
        folderIdMapping[folder.id] = savedId;
      }

      const queryIdsForThisVersion = new Set(importingDataQueriesForAppVersion.map((q) => q.id));
      const folderIdsForThisVersion = new Set(foldersForVersion.map((f) => f.id));

      const mappingsForVersion = importingDataQueryFolderMappings.filter(
        (m) =>
          (m.childType === ChildType.FOLDER && folderIdsForThisVersion.has(m.childId)) ||
          (m.childType === ChildType.QUERY && queryIdsForThisVersion.has(m.childId))
      );

      for (const mapping of mappingsForVersion) {
        const newChildId =
          mapping.childType === ChildType.FOLDER
            ? folderIdMapping[mapping.childId]
            : appResourceMappings.dataQueryMapping[mapping.childId];
        const newParentId = mapping.parentId ? (folderIdMapping[mapping.parentId] ?? null) : null;
        if (!newChildId) continue;

        // Skip if we've already inserted a mapping for this (child, type) pair during a
        // previous version iteration. Required because the DB enforces UNIQUE(child, type)
        // and queries share co_relation_id across versions, producing duplicate mapping rows
        // in the git export that all resolve to the same local child id on import.
        const childKey = `${newChildId}|${mapping.childType}`;
        if (insertedMappingChildKeys.has(childKey)) continue;
        insertedMappingChildKeys.add(childKey);

        const newMapping = manager.create(DataQueryFolderMapping, {
          parentId: newParentId,
          childId: newChildId,
          childType: mapping.childType,
          index: mapping.index,
          co_relation_id: mapping.id,
        });
        await manager.save(DataQueryFolderMapping, newMapping);
      }

      const pagesOfAppVersion = importingPages.filter((page) => page.appVersionId === importingAppVersion.id);
      const oldNewIdMap = {};
      const pageGroupIdArr = [];

      for (const page of pagesOfAppVersion) {
        const newPage = manager.create(Page, {
          name: page.name,
          handle: page.handle,
          appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
          index: page.index,
          pageGroupIndex: page.pageGroupIndex ?? null,
          disabled: page.disabled || false,
          hidden: page.hidden || false,
          pageHeader: page.pageHeader || null,
          pageFooter: page.pageFooter || null,
          autoComputeLayout: page.autoComputeLayout || false,
          icon: page.icon || null,
          isPageGroup: !!page.isPageGroup,
          type: page.type || PageType.DEFAULT,
          openIn: page.openIn || PageOpenIn.SAME_TAB,
          url: page.url || null,
          appId: page.appId || '',
        });

        const pageCreated = await manager.save(newPage);
        oldNewIdMap[page.id] = pageCreated.id;
        if (page.pageGroupId) {
          pageGroupIdArr.push({
            pageId: page.id,
            groupId: page.pageGroupId,
          });
        }

        if (page.permissions) {
          pageCreated.permissions = page.permissions;
        }

        appResourceMappings.pagesMapping[page.id] = pageCreated.id;

        isHomePage = importingAppVersion.homePageId === page.id;

        // can comment this after testing --> can uncomment this to fix this issue
        if (isHomePage) {
          updateHomepageId = pageCreated.id;
        }

        //create page permissions of page if flag enabled in dto
        await this.createPagePermissionsForGroups(pageCreated, user.organizationId, manager);

        const pageComponents = importingComponents.filter((component) => component.pageId === page.id);

        // Heal any parent-child cycles in the imported tree BEFORE we begin ID
        // remapping. A cycle reaching this point (corrupt source app / hand-
        // edited JSON / git-merge artifact) would otherwise persist verbatim
        // and freeze the canvas on first open. The helper mutates
        // component.parent in place on the deterministically-chosen node.
        const { repairedIds } = repairParentCycles(pageComponents);
        if (repairedIds.length > 0) {
          this.transactionLogger.warn(
            `[app-import] Repaired ${repairedIds.length} parent-child cycle(s) on page ${page.id}. ` +
              `Components bubbled to canvas root: ${repairedIds.join(', ')}`
          );
        }

        const newComponentIdsMap = {};
        for (const component of pageComponents) {
          newComponentIdsMap[component.id] = uuid();
        }

        for (const component of pageComponents) {
          let skipComponent = false;
          const newComponent = new Component();

          let parentId = component.parent ? component.parent : null;
          if (component?.properties?.buttonToSubmit) {
            const newButtonToSubmitValue = newComponentIdsMap[component?.properties?.buttonToSubmit?.value];
            if (newButtonToSubmitValue) set(component, 'properties.buttonToSubmit.value', newButtonToSubmitValue);
          }

          // Preserve virtual container parents (canvas-header, canvas-footer) as-is
          // These are not UUID-based and should not be remapped
          if (parentId !== 'canvas-header' && parentId !== 'canvas-footer') {
            const isParentTabOrCalendar = isChildOfTabsOrCalendar(component, pageComponents, parentId, true);
            const isParentHeaderOrFooter =
              component?.parent && (component?.parent.includes('header') || component?.parent.includes('footer'));

            if (isParentTabOrCalendar) {
              const childTabId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[2] : null;

              const _parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;
              const mappedParentId = newComponentIdsMap[_parentId];

              parentId = `${mappedParentId}-${childTabId}`;
            } else if (isChildOfKanbanModal(component, pageComponents, parentId, true)) {
              const _parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;
              const mappedParentId = newComponentIdsMap[_parentId];

              parentId = `${mappedParentId}-modal`;
            } else if (isParentHeaderOrFooter) {
              const _parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;
              const mappedParentId = newComponentIdsMap[_parentId];
              const headerOrFooter = component.parent?.includes('header') ? 'header' : 'footer';
              parentId = `${mappedParentId}-${headerOrFooter}`;
            } else {
              if (component.parent && !newComponentIdsMap[parentId]) {
                skipComponent = true;
              }

              parentId = newComponentIdsMap[parentId];
            }
          }
          if (!skipComponent) {
            const { properties, styles, general, validation, generalStyles } = migrateProperties(
              component.type as NewRevampedComponent,
              component,
              NewRevampedComponents,
              tooljetVersion
            );
            newComponent.id = newComponentIdsMap[component.id];
            newComponent.name = component.name;
            newComponent.type = component.type;
            newComponent.properties = properties;
            newComponent.styles = styles;
            newComponent.generalStyles = generalStyles;
            newComponent.general = general;
            newComponent.displayPreferences = component.displayPreferences;
            newComponent.validation = validation;
            newComponent.parent = component.parent ? parentId : null;

            if (component.type === 'ModuleViewer' && moduleResourceMappings && !isGitApp) {
              // ModuleViewer properties carry stable cross-instance keys:
              //   moduleAppId.value     = module App.co_relation_id
              //   moduleVersionId.value = AppVersion.module_reference_id (uuid) or "" (unpinned)
              // The version id is portable across instances by design — no rewrite needed.
              // Only the app id may need remapping for non-git imports (file upload, clone)
              // where the source payload could contain a DB id rather than a co_relation_id.
              if (properties.moduleAppId?.value && moduleResourceMappings.moduleApps) {
                const oldAppId = properties.moduleAppId.value;
                if (moduleResourceMappings.moduleApps[oldAppId]) {
                  properties.moduleAppId.value = moduleResourceMappings.moduleApps[oldAppId];
                }
              }
            }
            newComponent.properties = properties || {};

            newComponent.page = pageCreated;

            const savedComponent = await manager.save(newComponent);

            // Handle ModuleViewer component query input mapping
            if (savedComponent.type === 'ModuleViewer') {
              await this.handleModuleViewerComponent(
                savedComponent,
                appResourceMappings.dataQueryMapping,
                manager,
                user.organizationId
              );
              // Save the component again if properties were updated
              await manager.save(savedComponent);
            }

            appResourceMappings.componentsMapping[component.id] = savedComponent.id;
            const componentLayout = component.layouts;

            await Promise.all(
              componentLayout.map(async (layout) => {
                const newLayout = new Layout();
                newLayout.type = layout.type;
                newLayout.top = layout.top;
                newLayout.left =
                  layout.dimensionUnit !== LayoutDimensionUnits.COUNT
                    ? this.componentsService.resolveGridPositionForComponent(layout.left, layout.type)
                    : layout.left;
                newLayout.dimensionUnit = LayoutDimensionUnits.COUNT;
                newLayout.width = layout.width;
                newLayout.height = layout.height;
                if (layout.widthPx != null) newLayout.widthPx = layout.widthPx;
                if (layout.fillWidth != null) newLayout.fillWidth = layout.fillWidth;
                newLayout.component = savedComponent;
                newLayout.co_relation_id = layout.id;

                await manager.save(newLayout);
              })
            );

            if (component.permissions) {
              savedComponent.permissions = component.permissions;
            }

            //create component permissions of component if flag enabled in dto
            await this.createComponentPermissionsForGroups(savedComponent, user.organizationId, manager);

            const componentEvents = importingEvents.filter((event) => event.sourceId === component.id);

            if (componentEvents.length > 0) {
              await Promise.all(
                componentEvents.map(async (componentEvent) => {
                  const newEvent = await manager.create(EventHandler, {
                    name: componentEvent.name,
                    sourceId: savedComponent.id,
                    target: componentEvent.target,
                    event: componentEvent.event,
                    index: componentEvent.index,
                    appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                    co_relation_id: componentEvent.id || undefined,
                  });

                  await manager.save(EventHandler, newEvent);
                })
              );
            }
          }
        }

        const pageEvents = importingEvents.filter((event) => event.sourceId === page.id);

        if (pageEvents.length > 0) {
          await Promise.all(
            pageEvents.map(async (pageEvent) => {
              const newEvent = await manager.create(EventHandler, {
                name: pageEvent.name,
                sourceId: pageCreated.id,
                target: pageEvent.target,
                event: pageEvent.event,
                index: pageEvent.index,
                appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                co_relation_id: pageEvent.id || undefined,
              });

              await manager.save(EventHandler, newEvent);
            })
          );
        }
      }

      // relink page groups
      const updateArr = [];
      for (const { pageId, groupId } of pageGroupIdArr) {
        updateArr.push(manager.update(Page, { id: oldNewIdMap[pageId] }, { pageGroupId: oldNewIdMap[groupId] }));
      }
      await Promise.all(updateArr);

      const newDataQueries = await manager.find(DataQuery, {
        where: {
          appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
        },
      });

      for (const importedDataQuery of importingDataQueriesForAppVersion) {
        const mappedNewDataQuery = newDataQueries.find(
          (dq) => dq.id === appResourceMappings.dataQueryMapping[importedDataQuery.id]
        );

        if (!mappedNewDataQuery) continue;

        const importingQueryEvents = importingEvents.filter(
          (event) => event.target === Target.dataQuery && event.sourceId === importedDataQuery.id
        );

        if (importingQueryEvents.length > 0) {
          await Promise.all(
            importingQueryEvents.map(async (dataQueryEvent) => {
              const newEvent = await manager.create(EventHandler, {
                name: dataQueryEvent.name,
                sourceId: mappedNewDataQuery.id,
                target: dataQueryEvent.target,
                event: dataQueryEvent.event,
                index: dataQueryEvent.index,
                appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                co_relation_id: dataQueryEvent.id || undefined,
              });

              await manager.save(EventHandler, newEvent);
            })
          );
        } else {
          this.replaceDataQueryOptionsWithNewDataQueryIds(
            mappedNewDataQuery?.options,
            appResourceMappings.dataQueryMapping
          );
          const queryEvents = mappedNewDataQuery?.options?.events || [];

          delete mappedNewDataQuery?.options?.events;

          if (queryEvents.length > 0) {
            await Promise.all(
              queryEvents.map(async (event, index) => {
                const newEvent = await manager.create(EventHandler, {
                  name: this.getEventHandlerName(event),
                  sourceId: mappedNewDataQuery.id,
                  target: Target.dataQuery,
                  event: event,
                  index: event.index ?? index,
                  appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
                });

                await manager.save(EventHandler, newEvent);
              })
            );
          }
        }

        await manager.save(mappedNewDataQuery);
      }

      await manager.update(
        AppVersion,
        { id: appResourceMappings.appVersionMapping[importingAppVersion.id] },
        {
          homePageId: updateHomepageId,
        }
      );
    }

    // const appVersionIds = Object.values(appResourceMappings.appVersionMapping);

    // for (const appVersionId of appVersionIds) {
    //   await this.updateEventActionsForNewVersionWithNewMappingIds(
    //     manager,
    //     appVersionId,
    //     appResourceMappings.dataQueryMapping,
    //     appResourceMappings.componentsMapping,
    //     appResourceMappings.pagesMapping
    //   );
    // }

    return appResourceMappings;
  }

  /**
   * Updates workflow definition query references with newly created query IDs during app import.
   *
   * Note: For workflow apps, the entire workflow definition (including nodes, edges, and query mappings)
   * is stored as JSON in the app_versions.definition column. Unlike regular apps where queries are
   * stored as separate entities, workflow queries are referenced within this JSON structure through
   * a queries array that maps workflow node IDs (idOnDefinition) to actual data query IDs.
   *
   * During import, new data queries are created with different IDs, so we need to update the
   * workflow definition's queries array to reference these new IDs while preserving the
   * idOnDefinition values that link to workflow nodes.
   */
  private async updateWorkflowDefinitionQueryReferences(
    manager: EntityManager,
    appVersionIds: string[],
    resourceMapping: AppResourceMappings
  ): Promise<void> {
    // Get the app versions with their definitions and associated apps
    const appVersionsWithDefinitions = await manager
      .createQueryBuilder(AppVersion, 'appVersion')
      .leftJoinAndSelect('appVersion.app', 'app')
      .where('appVersion.id IN(:...appVersionIds)', { appVersionIds })
      .select(['appVersion.id', 'appVersion.definition', 'app.type'])
      .getMany();

    const workflowAppVersions = appVersionsWithDefinitions.filter(
      (appVersion) => appVersion.app?.type === 'workflow' && appVersion.definition?.queries
    );

    if (workflowAppVersions.length > 0) {
      for (const appVersion of workflowAppVersions) {
        const definition = appVersion.definition;
        let definitionUpdated = false;

        // Update query IDs in the workflow definition
        if (definition.queries && Array.isArray(definition.queries)) {
          definition.queries = definition.queries.map((query) => {
            if (query.id && resourceMapping.dataQueryMapping[query.id]) {
              definitionUpdated = true;
              return {
                ...query,
                id: resourceMapping.dataQueryMapping[query.id],
              };
            }
            return query;
          });
        }

        if (definitionUpdated) {
          await manager.update(AppVersion, { id: appVersion.id }, { definition });
        }
      }
    }
  }

  async rejectMarketplacePluginsNotInstalled(
    manager: EntityManager,
    importingDataSources: DataSource[]
  ): Promise<DataSource[]> {
    const pluginsFound = new Set<string>();

    const isPluginInstalled = async (kind: string): Promise<boolean> => {
      if (pluginsFound.has(kind)) return true;

      const pluginExists = !!(await manager.findOne(Plugin, {
        where: { pluginId: kind },
      }));

      if (pluginExists) pluginsFound.add(kind);

      return pluginExists;
    };

    const filteredDataSources: DataSource[] = [];

    for (const ds of importingDataSources) {
      const isPlugin = !!ds.pluginId;
      if (!isPlugin || (isPlugin && (await isPluginInstalled(ds.kind)))) {
        filteredDataSources.push(ds);
      }
    }

    return filteredDataSources;
  }

  async createDataQueriesForAppVersion(
    manager: EntityManager,
    organizationId: string,
    importingDataQueriesForAppVersion: DataQuery[],
    importingDataSource: DataSource,
    dataSourceForAppVersion: DataSource,
    importingAppVersion: AppVersion,
    appResourceMappings: AppResourceMappings,
    externalResourceMappings: { [x: string]: any }
  ) {
    appResourceMappings = { ...appResourceMappings };
    const importingQueriesForSource = importingDataQueriesForAppVersion.filter(
      (dq: { dataSourceId: any }) => dq.dataSourceId === importingDataSource.id
    );
    if (isEmpty(importingDataQueriesForAppVersion)) return appResourceMappings;

    for (const importingQuery of importingQueriesForSource) {
      const options =
        importingDataSource.kind === 'tooljetdb'
          ? this.replaceTooljetDbTableIds(
              importingQuery.options,
              externalResourceMappings['tooljet_database'],
              organizationId
            )
          : importingQuery.options;

      const newQuery = manager.create(DataQuery, {
        name: importingQuery.name,
        options,
        dataSourceId: dataSourceForAppVersion.id,
        appVersionId: appResourceMappings.appVersionMapping[importingAppVersion.id],
      });

      await manager.save(newQuery);

      if (importingQuery.permissions) {
        newQuery.permissions = importingQuery.permissions;
      }

      appResourceMappings.dataQueryMapping[importingQuery.id] = newQuery.id;

      //create query permissions of query if flag enabled in dto
      await this.createQueryPermissionsForGroups(newQuery, organizationId, manager);
    }

    return appResourceMappings;
  }

  isExistingDataSource(dataSourceForAppVersion: DataSource): boolean {
    return !!dataSourceForAppVersion.createdAt;
  }

  async createDataSourceOptionsForExistingAppEnvs(
    manager: EntityManager,
    appVersion: AppVersion,
    dataSourceForAppVersion: DataSource,
    dataSourceOptions: any[],
    importingDataSource: DataSource,
    appEnvironments: AppEnvironment[],
    appResourceMappings: AppResourceMappings,
    defaultAppEnvironmentId: string
  ) {
    appResourceMappings = { ...appResourceMappings };
    const importingDatasourceOptionsForAppVersion = dataSourceOptions.filter(
      (dso: { dataSourceId: string }) => dso.dataSourceId === importingDataSource.id
    );
    // create the datasource options for datasource if other environments present which is not in the export
    if (appEnvironments?.length !== appResourceMappings.appDefaultEnvironmentMapping[appVersion.id].length) {
      const availableEnvironments = importingDatasourceOptionsForAppVersion.map(
        (option) => appResourceMappings.appEnvironmentMapping[option.environmentId]
      );
      const otherEnvironmentsIds = appResourceMappings.appDefaultEnvironmentMapping[appVersion.id].filter(
        (defaultEnv) => !availableEnvironments.includes(defaultEnv)
      );
      const defaultEnvDsOption = importingDatasourceOptionsForAppVersion.find(
        (dso) => dso.environmentId === defaultAppEnvironmentId
      );
      for (const otherEnvironmentId of otherEnvironmentsIds) {
        // Check if DSVO already exists for this env
        const defaultDsv = await manager.findOne(DataSourceVersion, {
          where: { dataSourceId: dataSourceForAppVersion.id, isDefault: true },
        });
        const existing = defaultDsv
          ? await manager.findOne(DataSourceVersionOptions, {
              where: { dataSourceVersionId: defaultDsv.id, environmentId: otherEnvironmentId },
            })
          : null;
        if (!existing) {
          await this.createDatasourceOption(
            manager,
            defaultEnvDsOption.options,
            otherEnvironmentId,
            dataSourceForAppVersion.id
          );
        }
      }
    }

    // create datasource options only for newly created datasources
    for (const importingDataSourceOption of importingDatasourceOptionsForAppVersion) {
      if (importingDataSourceOption?.environmentId in appResourceMappings.appEnvironmentMapping) {
        const mappedEnvId = appResourceMappings.appEnvironmentMapping[importingDataSourceOption.environmentId];
        const defaultDsv = await manager.findOne(DataSourceVersion, {
          where: { dataSourceId: dataSourceForAppVersion.id, isDefault: true },
        });
        const existing = defaultDsv
          ? await manager.findOne(DataSourceVersionOptions, {
              where: { dataSourceVersionId: defaultDsv.id, environmentId: mappedEnvId },
            })
          : null;

        if (!existing) {
          await this.createDatasourceOption(
            manager,
            importingDataSourceOption.options,
            mappedEnvId,
            dataSourceForAppVersion.id
          );
        }
      }
    }
  }

  async createDefaultDatasourcesForAppVersion(
    manager: EntityManager,
    appVersion: AppVersion,
    user: User,
    appResourceMappings: AppResourceMappings
  ) {
    const defaultDataSourceIds = await this.createDefaultDataSourceForVersion(user.organizationId, manager);
    appResourceMappings.defaultDataSourceIdMapping[appVersion.id] = defaultDataSourceIds;

    return appResourceMappings;
  }

  async findOrCreateDataSourceForAppVersion(
    manager: EntityManager,
    dataSource: DataSource,
    user: User,
    isGitApp = false,
    branchId?: string
  ): Promise<DataSource> {
    const isDefaultDatasource = DefaultDataSourceNames.includes(dataSource.name as DefaultDataSourceName);
    const isSampleDatasource = (dataSource as any).type === DataSourceTypes.SAMPLE;
    const isPlugin = !!dataSource.pluginId;

    if (isDefaultDatasource) {
      const createdDefaultDatasource = await manager.findOne(DataSource, {
        where: {
          organizationId: user.organizationId,
          kind: dataSource.kind,
          type: DataSourceTypes.STATIC,
          scope: DataSourceScopes.GLOBAL,
        },
      });

      return createdDefaultDatasource;
    }

    // Sample DS — one-per-org, type=SAMPLE, scope=GLOBAL. Route to the target
    // workspace's existing row by (organizationId, type=SAMPLE) — exactly the
    // same pattern as static but on the SAMPLE type. The connection options are
    // env-driven (SAMPLE_PG_DB_*), so no per-import config copy is needed.
    if (isSampleDatasource) {
      const sampleDatasource = await manager.findOne(DataSource, {
        where: {
          organizationId: user.organizationId,
          type: DataSourceTypes.SAMPLE,
          scope: DataSourceScopes.GLOBAL,
        },
      });
      return sampleDatasource;
    }

    const globalDataSourceWithSameIdExists = async (dataSource: DataSource) => {
      return await manager.findOne(DataSource, {
        where: {
          id: dataSource.id,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          scope: DataSourceScopes.GLOBAL,
          organizationId: user.organizationId,
        },
      });
    };
    // Git exports replace id with co_relation_id, so the imported dataSource.id
    // is actually the source's co_relation_id. Look up by co_relation_id to
    // find existing DS that were previously imported or created locally.
    // Filter out dummies — if both a dummy and a real DS share the same
    // co_relation_id (e.g. a previous pull created a dummy and a later pull
    // created the real one), always pick the real one. Reconciliation runs
    // separately to clean up the orphaned dummy.
    const globalDataSourceByCoRelationId = async (dataSource: DataSource) => {
      return await manager.findOne(DataSource, {
        where: {
          co_relation_id: dataSource.id,
          scope: DataSourceScopes.GLOBAL,
          organizationId: user.organizationId,
          is_dummy: false,
        },
      });
    };
    const globalDataSourceWithSameNameExists = async (dataSource: DataSource) => {
      // DEFAULT (user-created) global DSes only — match by name is the right
      // fallback for those. SAMPLE is handled explicitly via the `isSampleDatasource`
      // early-return above (lookup by `type=SAMPLE` only, never by name) to avoid
      // colliding with a custom DS that happens to share the sample DS's name.
      return await manager.findOne(DataSource, {
        where: {
          name: dataSource.name,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          scope: DataSourceScopes.GLOBAL,
          organizationId: user.organizationId,
        },
      });
    };
    const existingDatasource =
      (await globalDataSourceWithSameIdExists(dataSource)) ||
      (await globalDataSourceByCoRelationId(dataSource)) ||
      (await globalDataSourceWithSameNameExists(dataSource));

    // For git imports on a specific branch, a real DS that exists in the
    // workspace but has no DSV on this branch is effectively not-yet-pulled
    // here (e.g. user created the DS on another branch and only pushed the
    // app, not the workspace data sources). Treat it as missing so we fall
    // through to dummy creation; queries get bound to the dummy until a later
    // workspace pull brings the DS file into git, creates a branch DSV, and
    // reconcileDummyDataSources retargets the queries to the real DS.
    let useExisting = !!existingDatasource;
    if (existingDatasource && isGitApp && branchId) {
      const branchDsv = await manager.findOne(DataSourceVersion, {
        where: { dataSourceId: existingDatasource.id, branchId, isActive: true },
      });
      if (!branchDsv) {
        useExisting = false;
      }
    }
    if (useExisting && existingDatasource) return existingDatasource;

    if (isGitApp) {
      // Per-app dataSources are no longer pushed to git. When a query
      // references a co_relation_id that doesn't resolve to any global DS
      // in this workspace (and no root data-sources/{coRelId}.json exists
      // either), we create a dummy placeholder so the app still imports.
      // - Name: `<original>_dummy` (or `unresolved_<full-co_relation_id>_dummy` if unknown)
      // - Kind: from git file if known, else 'restapi' (safe generic)
      // - co_relation_id: preserved so a later pull can swap in the real DS
      const baseName = (dataSource.name || `unresolved_${dataSource.id || ''}`).replace(/_dummy$/, '');
      const dummyName = `${baseName}_dummy`;
      const dummyKind = dataSource.kind || 'restapi';
      // Lookup plugin by kind (npm pkg id). Per-app git file drops DataSource.pluginId,
      // so old lookup-by-id always missed → dummy got plugin_id=NULL → frontend crash.
      let pluginId: string | null = null;
      const installedPlugin = await manager.findOne(Plugin, { where: { pluginId: dummyKind } });
      if (installedPlugin) pluginId = installedPlugin.id;
      // Reuse an existing dummy with the same co_relation_id if one was
      // already created for another query in this app (or another app in the
      // same org).
      const existingDummy = await manager.findOne(DataSource, {
        where: {
          co_relation_id: dataSource.id,
          organizationId: user.organizationId,
          is_dummy: true,
          scope: DataSourceScopes.GLOBAL,
        },
      });
      if (existingDummy) return existingDummy;

      const dummy = manager.create(DataSource, {
        organizationId: user?.organizationId,
        name: dummyName,
        kind: dummyKind,
        type: DataSourceTypes.DEFAULT,
        scope: DataSourceScopes.GLOBAL,
        pluginId,
        is_dummy: true,
      });
      await manager.save(dummy);
      dummy.co_relation_id = dataSource.id || (null as any);
      await manager.update(DataSource, { id: dummy.id }, { co_relation_id: dummy.co_relation_id });
      return dummy;
    }

    const createDsFromPluginInstalled = async (ds: DataSource): Promise<DataSource> => {
      const plugin = await manager.findOneOrFail(Plugin, {
        where: {
          pluginId: dataSource.kind,
        },
      });

      if (plugin) {
        const newDataSource = manager.create(DataSource, {
          organizationId: user?.organizationId,
          name: dataSource.name,
          kind: dataSource.kind,
          type: DataSourceTypes.DEFAULT,
          scope: DataSourceScopes.GLOBAL,
          pluginId: plugin.id,
        });
        await manager.save(newDataSource);

        // Set co_relation_id so workspace git sync can identify this DS.
        // Use the imported id (source's co_relation_id) to maintain identity across branches.
        newDataSource.co_relation_id = dataSource.id || (null as any);
        await manager.update(DataSource, { id: newDataSource.id }, { co_relation_id: newDataSource.co_relation_id });

        return newDataSource;
      }
    };

    const createNewGlobalDs = async (ds: DataSource): Promise<DataSource> => {
      const newDataSource = manager.create(DataSource, {
        organizationId: user?.organizationId,
        name: dataSource.name,
        kind: dataSource.kind,
        type: DataSourceTypes.DEFAULT,
        scope: DataSourceScopes.GLOBAL,
        pluginId: null,
      });
      await manager.save(newDataSource);

      // Set co_relation_id so workspace git sync can identify this DS.
      // Use the imported id (source's co_relation_id) to maintain identity across branches.
      newDataSource.co_relation_id = dataSource.id || (null as any);
      await manager.update(DataSource, { id: newDataSource.id }, { co_relation_id: newDataSource.co_relation_id });

      return newDataSource;
    };

    if (isPlugin) {
      return await createDsFromPluginInstalled(dataSource);
    } else {
      return await createNewGlobalDs(dataSource);
    }
  }

  /**
   * For a newly created data source, create a branch-specific DSV record
   * so that workspace git sync recognizes it on the active branch.
   * Copies options from the default DSV to the branch DSV.
   */
  private async ensureBranchDsvForDataSource(
    manager: EntityManager,
    dataSource: DataSource,
    organizationId: string,
    branchId?: string
  ): Promise<void> {
    // Ensure the default DSV first — independent of any git branch. The default
    // DSV (is_default=true, branch_id=null) is the data source's canonical version
    // and must exist for every real data source. Dummy / optionless data sources
    // skip the options-driven DSV creation in the import loop (gated on
    // `importingDataSource.options`), and a non-git workspace has no branch to
    // trigger the branch path below — so without ensuring it here the DS ends up
    // with zero DSVs (queries bound, but the DS unusable on the data source page).
    // Find-or-create keeps it idempotent: option-bearing DSes already created their
    // default DSV upstream and just match here.
    let defaultDsv = await manager.findOne(DataSourceVersion, {
      where: { dataSourceId: dataSource.id, isDefault: true },
    });
    if (!defaultDsv) {
      defaultDsv = await manager.save(
        manager.create(DataSourceVersion, {
          dataSourceId: dataSource.id,
          name: dataSource.name || 'v1',
          isDefault: true,
          isActive: true,
          branchId: null,
        })
      );
      // Create an empty DSVO for every org environment so the datasource page
      // environment tabs don't crash. Without these rows the page queries
      // DataSourceVersionOptions per env, gets nothing, and breaks.
      // Fields will be empty — user reconfigures after import.
      const orgEnvironments = await manager.find(AppEnvironment, {
        where: { organizationId },
      });
      for (const env of orgEnvironments) {
        await manager.save(
          manager.create(DataSourceVersionOptions, {
            dataSourceVersionId: defaultDsv.id,
            environmentId: env.id,
            options: {},
          })
        );
      }
    }

    // Resolve target branch for the branch-specific DSV: use explicit branchId, or
    // fall back to the default branch. Non-git workspaces have no branches — the
    // default DSV ensured above is all that's needed, so stop here.
    let targetBranchId = branchId;
    if (!targetBranchId) {
      const defaultBranch = await manager.findOne(WorkspaceBranch, {
        where: { organizationId, isDefault: true },
        select: ['id'],
      });
      if (!defaultBranch) return;
      targetBranchId = defaultBranch.id;
    }

    // Check if a branch-specific DSV already exists
    const existingBranchDsv = await manager.findOne(DataSourceVersion, {
      where: { dataSourceId: dataSource.id, branchId: targetBranchId },
    });
    if (existingBranchDsv) return;

    // Create branch-specific DSV
    const branchDsv = await manager.save(
      manager.create(DataSourceVersion, {
        dataSourceId: dataSource.id,
        branchId: targetBranchId,
        name: defaultDsv.name,
        isActive: true,
      })
    );

    // Copy options from default DSV to branch DSV, cloning credentials
    const defaultOptions = await manager.find(DataSourceVersionOptions, {
      where: { dataSourceVersionId: defaultDsv.id },
    });
    for (const dOpt of defaultOptions) {
      const clonedOptions = JSON.parse(JSON.stringify(dOpt.options || {}));
      for (const key of Object.keys(clonedOptions)) {
        const opt = clonedOptions[key];
        if (opt?.credential_id && opt?.encrypted) {
          const srcCredential = await manager.findOne(Credential, {
            where: { id: opt.credential_id },
          });
          if (srcCredential) {
            const newCredential = manager.create(Credential, {
              valueCiphertext: srcCredential.valueCiphertext,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            const savedCred = await manager.save(Credential, newCredential);
            clonedOptions[key] = { ...opt, credential_id: savedCred.id };
          }
        }
      }
      await manager.save(
        manager.create(DataSourceVersionOptions, {
          dataSourceVersionId: branchDsv.id,
          environmentId: dOpt.environmentId,
          options: clonedOptions,
        })
      );
    }
  }

  async associateAppEnvironmentsToAppVersion(
    manager: EntityManager,
    user: User,
    appEnvironments: Record<string, any>[],
    appVersion: AppVersion,
    appResourceMappings: AppResourceMappings
  ) {
    appResourceMappings = { ...appResourceMappings };
    const currentOrgEnvironments = await this.appEnvironmentUtilService.getAll(
      user?.organizationId,
      appVersion.appId,
      manager
    );

    if (!appEnvironments?.length) {
      currentOrgEnvironments.map((env) => (appResourceMappings.appEnvironmentMapping[env.id] = env.id));
    } else if (appEnvironments?.length && appEnvironments[0]?.appVersionId) {
      const appVersionedEnvironments = appEnvironments.filter(
        (appEnv: { appVersionId: string }) => appEnv.appVersionId === appVersion.id
      );
      for (const currentOrgEnv of currentOrgEnvironments) {
        const appEnvironment = appVersionedEnvironments.filter(
          (appEnv: { name: string }) => appEnv.name === currentOrgEnv.name
        )[0];
        if (appEnvironment) {
          appResourceMappings.appEnvironmentMapping[appEnvironment.id] = currentOrgEnv.id;
        }
      }
    } else {
      //For apps imported on v2 where organizationId not available
      for (const currentOrgEnv of currentOrgEnvironments) {
        const appEnvironment = appEnvironments.filter(
          (appEnv: { name: string }) => appEnv.name === currentOrgEnv.name
        )[0];
        if (appEnvironment) {
          appResourceMappings.appEnvironmentMapping[appEnvironment.id] = currentOrgEnv.id;
        }
      }
    }

    return appResourceMappings;
  }

  createViewerNavigationVisibilityForImportedApp(importedVersion: AppVersion) {
    let pageSettings = {};
    if (importedVersion.pageSettings) {
      pageSettings = { ...importedVersion.pageSettings };
    } else {
      pageSettings = {
        properties: {
          disableMenu: {
            value: `{{${!importedVersion.showViewerNavigation}}}`,
            fxActive: false,
          },
        },
      };
    }
    return pageSettings;
  }

  async checkIfGroupPermissionsExist(pages, queries, components, organizationId) {
    const allGroupNames = new Set<string>();

    for (const page of pages) {
      const groupNames = page.permissions?.permissionGroup || [];
      for (const name of groupNames) {
        allGroupNames.add(name);
      }
    }

    for (const query of queries) {
      const groupNames = query.permissions?.permissionGroup || [];
      for (const name of groupNames) {
        if (!allGroupNames.has(name)) {
          allGroupNames.add(name);
        }
      }
    }

    for (const component of components) {
      const groupNames = component.permissions?.permissionGroup || [];
      for (const name of groupNames) {
        if (!allGroupNames.has(name)) {
          allGroupNames.add(name);
        }
      }
    }

    if (!allGroupNames.size) return;

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const existingGroups = await manager
        .createQueryBuilder(GroupPermissions, 'gp')
        .where('gp.name IN (:...names)', { names: Array.from(allGroupNames) })
        .andWhere('gp.organizationId = :organizationId', { organizationId })
        .select(['gp.name'])
        .getMany();

      const existingGroupNames = new Set(existingGroups.map((g) => g.name));

      const missingGroups = Array.from(allGroupNames).filter((name) => !existingGroupNames.has(name));

      if (missingGroups.length > 0) {
        throw new HttpException(
          {
            message: {
              type: APP_ERROR_TYPE.IMPORT_EXPORT_SERVICE.PERMISSION_CHECK,
              data: missingGroups,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      }
    });
  }

  async createPagePermissionsForGroups(page, organizationId: string, manager: EntityManager) {
    const groupNames = page.permissions?.permissionGroup || [];
    if (!groupNames.length) return;

    const existingGroups = await manager
      .createQueryBuilder(GroupPermissions, 'gp')
      .where('gp.name IN (:...names)', { names: groupNames })
      .andWhere('gp.organizationId = :organizationId', { organizationId })
      .getMany();

    const groupMap = new Map(existingGroups.map((g) => [g.name, g]));

    // Filter to only existing group names
    const validGroupNames = groupNames.filter((name) => groupMap.has(name));

    // If no valid group names exist, do not create permissions
    if (!validGroupNames.length) return;

    const permission = manager.create(PagePermission, {
      pageId: page.id,
      type: PAGE_PERMISSION_TYPE.GROUP,
    });

    const savedPermission = await manager.save(permission);

    const pageUsers = validGroupNames.map((name) =>
      manager.create(PageUser, {
        pagePermissionsId: savedPermission.id,
        permissionGroupsId: groupMap.get(name).id,
      })
    );

    await manager.save(pageUsers);
  }

  async createQueryPermissionsForGroups(query, organizationId: string, manager: EntityManager) {
    const groupNames = query.permissions?.permissionGroup || [];
    if (!groupNames.length) return;

    const existingGroups = await manager
      .createQueryBuilder(GroupPermissions, 'gp')
      .where('gp.name IN (:...names)', { names: groupNames })
      .andWhere('gp.organizationId = :organizationId', { organizationId })
      .getMany();

    const groupMap = new Map(existingGroups.map((g) => [g.name, g]));

    // Filter to only existing group names
    const validGroupNames = groupNames.filter((name) => groupMap.has(name));

    // If no valid group names exist, do not create permissions
    if (!validGroupNames.length) return;

    const permission = manager.create(QueryPermission, {
      queryId: query.id,
      type: PAGE_PERMISSION_TYPE.GROUP,
    });

    const savedPermission = await manager.save(permission);

    const queryUsers = validGroupNames.map((name) =>
      manager.create(QueryUser, {
        queryPermissionsId: savedPermission.id,
        permissionGroupsId: groupMap.get(name).id,
      })
    );

    await manager.save(queryUsers);
  }

  async createComponentPermissionsForGroups(component, organizationId: string, manager: EntityManager) {
    const groupNames = component.permissions?.permissionGroup || [];
    if (!groupNames.length) return;

    const existingGroups = await manager
      .createQueryBuilder(GroupPermissions, 'gp')
      .where('gp.name IN (:...names)', { names: groupNames })
      .andWhere('gp.organizationId = :organizationId', { organizationId })
      .getMany();

    const groupMap = new Map(existingGroups.map((g) => [g.name, g]));

    // Filter to only existing group names
    const validGroupNames = groupNames.filter((name) => groupMap.has(name));

    // If no valid group names exist, do not create permissions
    if (!validGroupNames.length) return;

    const permission = manager.create(ComponentPermission, {
      componentId: component.id,
      type: PAGE_PERMISSION_TYPE.GROUP,
    });

    const savedPermission = await manager.save(permission);

    const componentUsers = validGroupNames.map((name) =>
      manager.create(ComponentUser, {
        componentPermissionsId: savedPermission.id,
        permissionGroupsId: groupMap.get(name).id,
      })
    );

    await manager.save(componentUsers);
  }

  async createAppVersionsForImportedApp(
    manager: EntityManager,
    user: User,
    importedApp: App,
    appVersions: AppVersion[],
    appResourceMappings: AppResourceMappings,
    isNormalizedAppDefinitionSchema: boolean,
    createNewVersion?: boolean,
    branchId?: string,
    useBranchVersionType = false
  ) {
    appResourceMappings = { ...appResourceMappings };
    const { appVersionMapping, appDefaultEnvironmentMapping } = appResourceMappings;
    const organization: Organization = await manager.findOne(Organization, {
      where: { id: user?.organizationId },
      relations: ['appEnvironments'],
    });
    let currentEnvironmentId: string;

    // Check if git sync is configured for the workspace
    const orgGitSync = await manager.findOne(OrganizationGitSync, {
      where: { organizationId: user?.organizationId },
    });
    const isGitSyncConfigured = !!orgGitSync;
    // Workflows are branch-agnostic — they are not synced to git and must not be
    // scoped to a branch or use the BRANCH version type, otherwise the versions
    // list (which filters by default branch / VERSION type) will hide them.
    const isWorkflow = importedApp.type === APP_TYPES.WORKFLOW;

    // Determine whether we are importing into a sub-branch (non-default).
    // Sub-branch versions must use BRANCH type so the canvas stays editable.
    // Applies to git-sync, clone, AND device imports on a feature branch (branchId set).
    // Skipped for workflows since they are branch-agnostic.
    let isSubBranch = false;
    let targetBranchName: string | null = null;
    if (!isWorkflow && branchId && useBranchVersionType) {
      const targetBranch = await manager.findOne(WorkspaceBranch, {
        where: { id: branchId },
        select: ['id', 'isDefault', 'name'],
      });
      isSubBranch = !!targetBranch && !targetBranch.isDefault;
      if (isSubBranch) targetBranchName = targetBranch.name;
    }

    // Find the latest draft version
    // When git sync is configured, only the latest draft should remain as DRAFT, others become PUBLISHED
    let latestDraftId: string | null = null;
    if (isGitSyncConfigured) {
      const draftVersions = appVersions.filter((v) => v.status === AppVersionStatus.DRAFT || !v.status);

      if (draftVersions.length > 0) {
        // Check if createdAt is available on the versions
        const hasCreatedAt = draftVersions.some((v) => v.createdAt);

        if (hasCreatedAt) {
          // Sort by createdAt descending to find the most recent draft
          const sortedDrafts = [...draftVersions].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA; // Descending order (latest first)
          });
          latestDraftId = sortedDrafts[0].id;
        } else {
          // If no createdAt available (export file), use the last draft in the array
          // The editingVersion (most recent) is typically the last one in appVersions array
          latestDraftId = draftVersions[draftVersions.length - 1].id;
        }
      }
    }

    for (const appVersion of appVersions) {
      const appEnvIds: string[] = [...organization.appEnvironments.map((env) => env.id)];

      //app is exported to CE
      if (defaultAppEnvironments.length === 1) {
        currentEnvironmentId = organization.appEnvironments.find((env: any) => env.isDefault)?.id;
      } else {
        //to EE or cloud
        currentEnvironmentId = organization.appEnvironments.find((env) => env.priority === 1)?.id;
      }

      let version;
      // this case only happens in the AI flow when app is imported within an existing app
      if (importedApp.editingVersion && !createNewVersion) {
        version = importedApp.editingVersion;
      } else {
        // Determine the version status
        // When git sync is configured and there are multiple drafts, only the latest draft stays as DRAFT
        let versionStatus: AppVersionStatus;
        const isDraftVersion = appVersion.status === AppVersionStatus.DRAFT || !appVersion.status;

        if (isSubBranch) {
          // On sub-branches, all versions must be DRAFT so the canvas stays editable.
          // PUBLISHED status would freeze the editor regardless of version type.
          versionStatus = AppVersionStatus.DRAFT;
        } else if (isGitSyncConfigured && isDraftVersion) {
          // Only the latest draft should remain as DRAFT, others become PUBLISHED
          versionStatus = appVersion.id === latestDraftId ? AppVersionStatus.DRAFT : AppVersionStatus.PUBLISHED;
        } else {
          // Preserve original status or default to DRAFT
          versionStatus = appVersion.status || AppVersionStatus.DRAFT;
        }

        const isLastVersion = appVersion === appVersions[appVersions.length - 1];
        // Non-workflows carry slug/appName/icon/isPublic on app_versions. Source the
        // values from the staged importMetadata, falling back to per-version values
        // in the import payload.
        const importMeta = !isWorkflow ? (importedApp as any).__importMetadata : null;

        // chk_app_versions_branch_metadata requires app_name AND slug to be non-null
        // whenever branch_id IS NOT NULL. Imports may carry NULL metadata (e.g. hydrate
        // temp apps, partial exports) — fall back to deterministic placeholders so the
        // INSERT doesn't violate the CHECK. Skipped for workflows (they store metadata
        // on apps.* and the constraint is exempt for branch_id=NULL rows).
        const resolvedSlug = !isWorkflow ? (appVersion.slug ?? importedApp.id) : undefined;
        const resolvedAppName = !isWorkflow
          ? (appVersion.appName ?? importMeta?.appName ?? importedApp.name ?? importedApp.id)
          : undefined;

        version = await manager.create(AppVersion, {
          appId: importedApp.id,
          definition: appVersion.definition,
          name: isSubBranch && isLastVersion && targetBranchName ? targetBranchName : appVersion.name,
          currentEnvironmentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: versionStatus,
          versionType: isSubBranch ? AppVersionType.BRANCH : AppVersionType.VERSION,
          parent_version_id: appVersion?.id || null,
          createdById: user.id,
          co_relation_id: appVersion.id || null,
          // Only DRAFT rows may carry a branch_id (chk_app_versions_branched_implies_draft).
          // PUBLISHED versions are branchless workspace history — e.g. hydrating a released
          // module produces a PUBLISHED temp row, which the git-pull re-parent later forces
          // back to DRAFT + branchId. Without this guard the INSERT violates the CHECK.
          branchId: isWorkflow || versionStatus !== AppVersionStatus.DRAFT ? null : branchId,
          // Preserve moduleReferenceId from source if present (cross-instance pull / git import).
          // Generate fresh for legacy payloads predating the column. Module-only.
          ...(importedApp.type === APP_TYPES.MODULE && {
            moduleReferenceId: appVersion.moduleReferenceId || uuid(),
          }),
          ...(!isWorkflow && {
            slug: resolvedSlug,
            appName: resolvedAppName,
            icon: appVersion.icon ?? importMeta?.icon ?? null,
            isPublic: appVersion.isPublic ?? importMeta?.isPublic ?? false,
          }),
        });
      }
      if (isNormalizedAppDefinitionSchema) {
        version.showViewerNavigation = appVersion.showViewerNavigation;
        version.homePageId = appVersion.homePageId;
        version.globalSettings = appVersion.globalSettings;
        version.pageSettings = this.createViewerNavigationVisibilityForImportedApp(appVersion);
      } else {
        version.showViewerNavigation = appVersion.definition?.showViewerNavigation ?? true;
        version.homePageId = appVersion.definition?.homePageId;

        if (!appVersion.definition?.globalSettings) {
          version.globalSettings = {
            hideHeader: false,
            appInMaintenance: false,
            canvasMaxWidth: 100,
            canvasMaxWidthType: '%',
            canvasMaxHeight: 2400,
            canvasBackgroundColor: '#edeff5',
            backgroundFxQuery: '',
            appMode: 'auto',
          };
        } else {
          version.globalSettings = appVersion.definition?.globalSettings;
          version.pageSettings = this.createViewerNavigationVisibilityForImportedApp(appVersion);
        }
      }

      await manager.save(version);
      appDefaultEnvironmentMapping[appVersion.id] = appEnvIds;
      appVersionMapping[appVersion.id] = version.id;
    }

    return appResourceMappings;
  }

  /**
   * Pick the "most recent" version from an exported app's appVersions[] array.
   *
   * Heuristic: prefer DRAFT versions (these represent the editing state at
   * export time). Among the preferred pool, use `createdAt` DESC if any row
   * carries the field; otherwise fall back to the last array slot (export
   * order from the source workspace).
   *
   * Used by sub-branch file imports — sub-branches carry a single editable
   * DRAFT and dropping history is the right move.
   */
  private pickLatestVersionFromImport(appVersions: any[]): any | null {
    if (!appVersions?.length) return null;
    if (appVersions.length === 1) return appVersions[0];

    const drafts = appVersions.filter((v: any) => !v.status || v.status === AppVersionStatus.DRAFT);
    const pool = drafts.length > 0 ? drafts : appVersions;

    const hasCreatedAt = pool.some((v: any) => v.createdAt);
    if (hasCreatedAt) {
      const sorted = [...pool].sort((a: any, b: any) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
      return sorted[0];
    }
    return pool[pool.length - 1];
  }

  async createDefaultDataSourceForVersion(organizationId: string, manager: EntityManager): Promise<any> {
    const dataSources = await this.dataSourcesRepository.getStaticDataSources(organizationId, manager);
    return dataSources?.reduce<Record<string, string>>((acc, source) => {
      acc[source.kind] = source.id;
      return acc;
    }, {});
  }

  async setEditingVersionAsLatestVersion(manager: EntityManager, appVersionMapping: any, appVersions: Array<any>) {
    if (isEmpty(appVersions)) return;

    const lastVersionFromImport = appVersions[appVersions.length - 1];
    const lastVersionIdToUpdate = appVersionMapping[lastVersionFromImport.id];

    await manager.update(AppVersion, { id: lastVersionIdToUpdate }, { updatedAt: new Date() });
  }

  async createDatasourceOption(
    manager: EntityManager,
    options: Record<string, unknown>,
    environmentId: string,
    dataSourceId: string
  ) {
    const convertedOptions = this.convertToArrayOfKeyValuePairs(options);
    const newOptions = await this.dataSourcesUtilService.parseOptionsForCreate(convertedOptions, true, manager);

    // Find-or-create default DSV, then create DSVO
    let defaultDsv = await manager.findOne(DataSourceVersion, {
      where: { dataSourceId, isDefault: true },
    });
    if (!defaultDsv) {
      const ds = await manager.findOne(DataSource, { where: { id: dataSourceId }, select: ['id', 'name'] });
      defaultDsv = await manager.save(
        manager.create(DataSourceVersion, {
          dataSourceId,
          name: ds?.name || 'v1',
          isDefault: true,
          isActive: true,
          branchId: null,
        })
      );
    }
    const existingDsvo = await manager.findOne(DataSourceVersionOptions, {
      where: { dataSourceVersionId: defaultDsv.id, environmentId },
    });
    if (!existingDsvo) {
      await manager.save(
        manager.create(DataSourceVersionOptions, {
          dataSourceVersionId: defaultDsv.id,
          environmentId,
          options: newOptions,
        })
      );
    } else {
      await manager.update(
        DataSourceVersionOptions,
        { id: existingDsvo.id },
        { options: newOptions, updatedAt: new Date() }
      );
    }
  }

  convertToArrayOfKeyValuePairs(options: Record<string, unknown>): Array<object> {
    if (!options) return;
    return Object.keys(options).map((key) => {
      return {
        key: key,
        value: options[key]['value'],
        encrypted: options[key]['encrypted'],
        workspace_constant: options[key]['workspace_constant'],
      };
    });
  }

  replaceDataQueryOptionsWithNewDataQueryIds(
    options: { events: Record<string, unknown>[] },
    dataQueryMapping: Record<string, string>
  ) {
    if (options && options.events) {
      const replacedEvents = options.events.map((event: { queryId: string }) => {
        if (event.queryId) {
          event.queryId = dataQueryMapping[event.queryId];
        }
        return event;
      });
      options.events = replacedEvents;
    }
    return options;
  }

  replaceDataQueryIdWithinDefinitions(
    definition: DeepPartial<any>,
    dataQueryMapping: Record<string, string>
  ): QueryDeepPartialEntity<any> {
    if (definition?.pages) {
      for (const pageId of Object.keys(definition?.pages)) {
        if (definition.pages[pageId].events) {
          const replacedPageEvents = definition.pages[pageId].events.map((event: { queryId: string }) => {
            if (event.queryId) {
              event.queryId = dataQueryMapping[event.queryId];
            }
            return event;
          });
          definition.pages[pageId].events = replacedPageEvents;
        }
        if (definition.pages[pageId].components) {
          for (const id of Object.keys(definition.pages[pageId].components)) {
            const component = definition.pages[pageId].components[id].component;

            if (component?.definition?.events) {
              const replacedComponentEvents = component.definition.events.map((event: { queryId: string }) => {
                if (event.queryId) {
                  event.queryId = dataQueryMapping[event.queryId];
                }
                return event;
              });
              component.definition.events = replacedComponentEvents;
            }

            if (component?.definition?.properties?.actions?.value) {
              for (const value of component.definition.properties.actions.value) {
                if (value?.events) {
                  const replacedComponentActionEvents = value.events.map((event: { queryId: string }) => {
                    if (event.queryId) {
                      event.queryId = dataQueryMapping[event.queryId];
                    }
                    return event;
                  });
                  value.events = replacedComponentActionEvents;
                }
              }
            }

            if (component?.component === 'Table') {
              for (const column of component?.definition?.properties?.columns?.value ?? []) {
                if (column?.events) {
                  const replacedComponentActionEvents = column.events.map((event: { queryId: string }) => {
                    if (event.queryId) {
                      event.queryId = dataQueryMapping[event.queryId];
                    }
                    return event;
                  });
                  column.events = replacedComponentActionEvents;
                }
              }
            }

            definition.pages[pageId].components[id].component = component;
          }
        }
      }
    }
    return definition;
  }

  async performLegacyAppImport(
    manager: EntityManager,
    importedApp: App,
    appParams: any,
    externalResourceMappings: any,
    user: any
  ) {
    const dataSourceMapping = {};
    const dataQueryMapping = {};
    const dataSources = appParams?.dataSources || [];
    const dataQueries = appParams?.dataQueries || [];
    let currentEnvironmentId = null;

    const importMeta = importedApp.type !== APP_TYPES.WORKFLOW ? (importedApp as any).__importMetadata : null;
    const version = manager.create(AppVersion, {
      appId: importedApp.id,
      definition: appParams.definition,
      name: 'v1',
      currentEnvironmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(importedApp.type === APP_TYPES.MODULE && { moduleReferenceId: uuid() }),
      ...(importMeta && {
        slug: importedApp.id,
        appName: importMeta.appName,
        icon: importMeta.icon,
        isPublic: importMeta.isPublic,
      }),
    });
    await manager.save(version);

    // Create default data sources
    const defaultDataSourceIds = await this.createDefaultDataSourceForVersion(user.organizationId, manager);
    let envIdArray: string[] = [];

    const organization: Organization = await manager.findOne(Organization, {
      where: { id: user?.organizationId },
      relations: ['appEnvironments'],
    });
    envIdArray = [...organization.appEnvironments.map((env) => env.id)];

    if (!envIdArray.length) {
      await Promise.all(
        defaultAppEnvironments.map(async (en) => {
          const env = manager.create(AppEnvironment, {
            organizationId: user?.organizationId,
            name: en.name,
            isDefault: en.isDefault,
            priority: en.priority,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          await manager.save(env);
          if (defaultAppEnvironments.length === 1 || en.priority === 1) {
            currentEnvironmentId = env.id;
          }
          envIdArray.push(env.id);
        })
      );
    } else {
      //get starting env from the organization environments list
      const { appEnvironments } = organization;
      if (appEnvironments.length === 1) currentEnvironmentId = appEnvironments[0].id;
      else {
        appEnvironments.map((appEnvironment) => {
          if (appEnvironment.priority === 1) currentEnvironmentId = appEnvironment.id;
        });
      }
    }

    for (const source of dataSources) {
      const convertedOptions = this.convertToArrayOfKeyValuePairs(source.options);

      const newSource = manager.create(DataSource, {
        name: source.name,
        kind: source.kind,
        appVersionId: version.id,
      });
      await manager.save(newSource);
      dataSourceMapping[source.id] = newSource.id;

      await Promise.all(
        envIdArray.map(async (envId) => {
          let newOptions: Record<string, unknown>;
          if (source.options) {
            newOptions = await this.dataSourcesUtilService.parseOptionsForCreate(convertedOptions, true, manager);
          }

          // Find-or-create default DSV, then create DSVO
          let defaultDsv = await manager.findOne(DataSourceVersion, {
            where: { dataSourceId: newSource.id, isDefault: true },
          });
          if (!defaultDsv) {
            defaultDsv = await manager.save(
              manager.create(DataSourceVersion, {
                dataSourceId: newSource.id,
                name: newSource.name || source.name || 'v1',
                isDefault: true,
                isActive: true,
                branchId: null,
              })
            );
          }
          const existingDsvo = await manager.findOne(DataSourceVersionOptions, {
            where: { dataSourceVersionId: defaultDsv.id, environmentId: envId },
          });
          if (!existingDsvo) {
            await manager.save(
              manager.create(DataSourceVersionOptions, {
                dataSourceVersionId: defaultDsv.id,
                environmentId: envId,
                options: newOptions,
              })
            );
          }
        })
      );
    }

    const newDataQueries = [];
    for (const query of dataQueries) {
      const dataSourceId = dataSourceMapping[query.dataSourceId];
      const newQuery = manager.create(DataQuery, {
        name: query.name,
        dataSourceId: !dataSourceId ? defaultDataSourceIds[query.kind] : dataSourceId,
        appVersionId: query.appVersionId,
        options:
          dataSourceId == defaultDataSourceIds['tooljetdb']
            ? this.replaceTooljetDbTableIds(
                query.options,
                externalResourceMappings['tooljet_database'],
                user?.organizationId
              )
            : query.options,
      });
      await manager.save(newQuery);
      dataQueryMapping[query.id] = newQuery.id;
      newDataQueries.push(newQuery);
    }

    for (const newQuery of newDataQueries) {
      const newOptions = this.replaceDataQueryOptionsWithNewDataQueryIds(newQuery.options, dataQueryMapping);
      const queryEvents = newQuery.options?.events || [];
      delete newOptions?.events;

      newQuery.options = newOptions;
      await manager.save(newQuery);

      await Promise.all(
        queryEvents.map(async (event, index) => {
          const newEvent = {
            name: this.getEventHandlerName(event),
            sourceId: newQuery.id,
            target: Target.dataQuery,
            event: event,
            index: queryEvents.index || index,
            appVersionId: newQuery.appVersionId,
          };

          await manager.save(EventHandler, newEvent);
        })
      );
    }

    await manager.update(
      AppVersion,
      { id: version.id },
      {
        definition: this.replaceDataQueryIdWithinDefinitions(version.definition, dataQueryMapping),
      }
    );
  }

  // Entire function should be santised for Undefined values
  replaceTooljetDbTableIds(queryOptions, tooljetDatabaseMapping, organizationId: string) {
    let transformedQueryOptions = { ...queryOptions };

    // FIXME: Even if the operation is not 'join_tables',
    // the queryOptions currently can have fields on join_table
    // if the user switches b/w operations in the UI
    if (Object.keys(queryOptions).includes('join_table')) {
      transformedQueryOptions = this.replaceTooljetDbTableIdOnJoin(
        queryOptions,
        tooljetDatabaseMapping,
        organizationId
      );
    }
    if (queryOptions?.operation === 'join_tables') {
      return transformedQueryOptions;
    }

    const mappedTableId = tooljetDatabaseMapping[transformedQueryOptions.table_id]?.id;
    return {
      ...transformedQueryOptions,
      ...(mappedTableId && { table_id: mappedTableId }),
      ...(organizationId && { organization_id: organizationId }),
    };
  }

  replaceTooljetDbTableIdOnJoin(
    queryOptions,
    tooljetDatabaseMapping,
    organizationId: string
  ): Partial<{
    table_id: string;
    join_table: unknown;
    organization_id: string;
  }> {
    const joinOptions = { ...(queryOptions?.join_table ?? {}) };

    // JOIN Section
    if (joinOptions?.joins && joinOptions.joins.length > 0) {
      const joinsTableIdUpdatedList = joinOptions.joins.map((joinCondition) => {
        const { join_type, ...restJoinCondition } = joinCondition;
        const updatedJoinCondition = { ...restJoinCondition, joinType: restJoinCondition.joinType ?? join_type };
        // Updating Join tableId
        if (updatedJoinCondition.table)
          updatedJoinCondition.table =
            tooljetDatabaseMapping[updatedJoinCondition.table]?.id ?? updatedJoinCondition.table;
        // Updating TableId on Conditions in Join Query
        if (updatedJoinCondition.conditions) {
          const updatedJoinConditionFilter = this.updateNewTableIdForFilter(
            updatedJoinCondition.conditions,
            tooljetDatabaseMapping
          );
          updatedJoinCondition.conditions = updatedJoinConditionFilter.conditions;
        }

        return updatedJoinCondition;
      });
      joinOptions.joins = joinsTableIdUpdatedList;
    }

    // Filter Section
    if (joinOptions?.conditions) {
      joinOptions.conditions = this.updateNewTableIdForFilter(
        joinOptions.conditions,
        tooljetDatabaseMapping
      ).conditions;
    }

    // Select Section
    if (joinOptions?.fields) {
      joinOptions.fields = joinOptions.fields.map((eachField) => {
        if (eachField.table) {
          eachField.table = tooljetDatabaseMapping[eachField.table]?.id ?? eachField.table;
          return eachField;
        }
        return eachField;
      });
    }

    // From Section
    if (joinOptions?.from) {
      const { name = '' } = joinOptions.from;
      joinOptions.from = {
        ...joinOptions.from,
        name: tooljetDatabaseMapping[name]?.id ?? name,
      };
    }

    // Sort Section
    if (joinOptions?.order_by) {
      joinOptions.order_by = joinOptions.order_by.map(({ column_name, columnName, table, ...rest }) => ({
        ...rest,
        ...(table && { table: tooljetDatabaseMapping[table]?.id ?? table }),
        columnName: columnName ?? column_name,
      }));
    }

    return {
      ...queryOptions,
      table_id: tooljetDatabaseMapping[queryOptions.table_id]?.id,
      join_table: joinOptions,
      organization_id: organizationId,
    };
  }

  private remapConditionField(field: Record<string, any>, tooljetDatabaseMapping: Record<string, any>) {
    const rawField = field ?? {};
    const columnName = rawField.columnName ?? rawField.column_name;
    return {
      type: rawField.type,
      ...(rawField.table && { table: tooljetDatabaseMapping[rawField.table]?.id ?? rawField.table }),
      ...(columnName !== undefined && { columnName }),
      ...(rawField.value !== undefined && { value: rawField.value }),
      ...(rawField.jsonpath !== undefined && { jsonpath: rawField.jsonpath }),
    };
  }

  updateNewTableIdForFilter(joinConditions: Record<string, any>, tooljetDatabaseMapping: Record<string, any>) {
    const rawConditionsList =
      [joinConditions?.conditions_list, joinConditions?.conditionsList].find((list) => list?.length) ?? [];
    const updatedConditionList = rawConditionsList.map((condition: Record<string, any>) => {
      if (condition.conditions) {
        return this.updateNewTableIdForFilter(condition.conditions, tooljetDatabaseMapping);
      }
      const leftField = this.remapConditionField(condition.leftField ?? condition.left_field, tooljetDatabaseMapping);
      const rightField = this.remapConditionField(
        condition.rightField ?? condition.right_field,
        tooljetDatabaseMapping
      );
      return { operator: condition.operator ?? '=', leftField, rightField };
    });
    return {
      conditions: {
        operator: joinConditions?.operator,
        conditionsList: updatedConditionList,
      },
    };
  }

  async updateEventActionsForNewVersionWithNewMappingIds(
    manager: EntityManager,
    versionId: string,
    oldDataQueryToNewMapping: Record<string, unknown>,
    oldComponentToNewComponentMapping: Record<string, unknown>,
    oldPageToNewPageMapping: Record<string, unknown>
  ) {
    const allEvents = await manager
      .createQueryBuilder(EventHandler, 'event')
      .where('event.appVersionId = :versionId', { versionId })
      .getMany();
    const mappings = {
      ...oldDataQueryToNewMapping,
      ...oldComponentToNewComponentMapping,
    } as Record<string, string>;

    for (const event of allEvents) {
      const eventDefinition = updateEntityReferences(event.event, mappings);

      if (eventDefinition?.actionId === 'run-query' && oldDataQueryToNewMapping[eventDefinition.queryId]) {
        eventDefinition.queryId = oldDataQueryToNewMapping[eventDefinition.queryId];
      }

      if (
        eventDefinition?.actionId === 'control-component' &&
        oldComponentToNewComponentMapping[eventDefinition.componentId]
      ) {
        eventDefinition.componentId = oldComponentToNewComponentMapping[eventDefinition.componentId];
      }

      if (eventDefinition?.actionId === 'switch-page' && oldPageToNewPageMapping[eventDefinition.pageId]) {
        eventDefinition.pageId = oldPageToNewPageMapping[eventDefinition.pageId];
      }

      if (
        (eventDefinition?.actionId == 'show-modal' || eventDefinition?.actionId === 'close-modal') &&
        oldComponentToNewComponentMapping[eventDefinition.modal]
      ) {
        eventDefinition.modal = oldComponentToNewComponentMapping[eventDefinition.modal];
      }

      if (eventDefinition?.actionId == 'set-table-page' && oldComponentToNewComponentMapping[eventDefinition.table]) {
        eventDefinition.table = oldComponentToNewComponentMapping[eventDefinition.table];
      }

      event.event = eventDefinition;

      await manager.save(event);
    }
  }

  /**
   * Handle ModuleViewer component by fetching module definition and updating input properties
   * during app import
   */
  protected async handleModuleViewerComponent(
    component: Component,
    dataQueryMapping: Record<string, unknown>,
    manager: EntityManager,
    organizationId?: string
  ): Promise<void> {
    const properties = component.properties;

    // Skip processing if moduleAppId is not present
    if (!properties?.moduleAppId?.value) {
      return;
    }

    const moduleAppId = properties.moduleAppId.value;
    try {
      // moduleAppId stores co_relation_id after migration — look up by co_relation_id.
      // Scope to module type (and organization when provided) so a colliding coRelId on
      // an app row, or a module in another workspace sharing the same DB, can't be matched.
      const moduleApp = (await manager.findOne(App, {
        where: {
          co_relation_id: moduleAppId,
          type: APP_TYPES.MODULE,
          ...(organizationId ? { organizationId } : {}),
        },
        relations: ['appVersions'],
      })) as App;

      if (!moduleApp) {
        console.warn(`Module with ID ${moduleAppId} not found`);
        return;
      }

      // Get the module's editing version or latest version
      const moduleVersion = moduleApp.appVersions?.[0]; // Assuming first version is the editing version
      if (!moduleVersion) {
        console.warn(`No version found for module with ID ${moduleAppId}`);
        return;
      }

      // Find the ModuleContainer component in the module to get input definitions
      const moduleComponents = await manager.find(Component, {
        where: {
          pageId: moduleVersion.homePageId,
          type: 'ModuleContainer',
        },
      });

      const moduleContainer = moduleComponents[0];
      if (!moduleContainer) {
        console.warn(`ModuleContainer not found in module ${moduleAppId}`);
        return;
      }

      const inputItems = moduleContainer.properties?.inputItems?.value || [];

      // Process each property in the ModuleViewer component
      const excludedProperties = ['moduleAppId', 'moduleVersionId', 'visibility'];

      for (const [propertyKey, propertyValue] of Object.entries(properties)) {
        // Skip excluded properties
        if (excludedProperties.includes(propertyKey)) {
          continue;
        }

        // Find matching input definition in module container
        const inputDefinition = inputItems.find((item) => item.name === propertyKey);

        if (inputDefinition && inputDefinition.type === 'query') {
          // This is a query input, check if we need to map the value to a new query ID
          const currentValue = (propertyValue as any)?.value;

          if (currentValue && dataQueryMapping[currentValue]) {
            // Update the property value with the new query ID
            properties[propertyKey] = {
              ...(propertyValue as any),
              value: dataQueryMapping[currentValue],
            };
          }
        }
        // For data type inputs, no special handling needed as they are just values
      }

      // Update component properties with the processed values
      component.properties = properties;
    } catch (error) {
      console.error(`Error handling ModuleViewer component ${component.id}:`, error);
      // Continue processing even if module handling fails
    }
  }
}

export function convertSinglePageSchemaToMultiPageSchema(appParams: any) {
  const appParamsWithMultipageSchema = {
    ...appParams,
    appVersions: appParams.appVersions?.map((appVersion: { definition: any }) => ({
      ...appVersion,
      definition: convertAppDefinitionFromSinglePageToMultiPage(appVersion.definition),
    })),
  };
  return appParamsWithMultipageSchema;
}

/**
 * Migrates styles to properties of the component based on the specified component types.
 * @param {NewRevampedComponent} componentType - Component type for which to perform property migration.
 * @param {Component} component - The component object containing properties, styles, and general information.
 * @param {NewRevampedComponent[]} componentTypes - An array of component types for which to perform property migration.
 * @returns {object} An object containing the modified properties, styles, and general information.
 */
function migrateProperties(
  componentType: NewRevampedComponent | PartialRevampedComponent | 'ModuleViewer',
  component: Component,
  componentTypes: (NewRevampedComponent | PartialRevampedComponent)[],
  tooljetVersion: string | null
) {
  const properties = { ...component.properties };
  const styles = { ...component.styles };
  const general = { ...component.general };
  const validation = { ...component.validation };
  const generalStyles = { ...component.generalStyles };

  if (DYNAMIC_HEIGHT_COMPONENT_TYPES.includes(componentType) && properties.collapseWhenHidden === undefined) {
    properties.collapseWhenHidden = { value: '{{false}}' };
  }

  if (MAX_LIMIT_COMPONENT_TYPES.includes(componentType) && properties.maxLimit === undefined) {
    properties.maxLimit = { value: '' };
  }

  if (TOOLTIP_FORMAT_COMPONENT_TYPES.includes(componentType) && properties.tooltipFormat === undefined) {
    properties.tooltipFormat = { value: 'plainText' };
  }

  if (!tooljetVersion) {
    return { properties, styles, general, generalStyles, validation };
  }

  const shouldHandleBackwardCompatibility = isVersionGreaterThanOrEqual(tooljetVersion, '2.29.0') ? false : true;

  if (PartialRevampedComponents.includes(componentType as PartialRevampedComponent)) {
    const defaultStylesByComponent: Record<string, Record<string, { value: string | number }>> = {
      CodeEditor: {
        borderColor: { value: 'var(--cc-weak-border)' },
        backgroundColor: { value: 'var(--cc-surface1-surface)' },
      },
      PDF: {
        borderRadius: { value: 0 },
        borderColor: { value: '#00000000' },
      },
      Calendar: {
        borderRadius: { value: 0 },
        borderColor: { value: '#00000000' },
      },
      CustomComponent: {
        boxShadow: { value: '0px 0px 0px 0px #00000040' },
        borderColor: { value: 'var(--cc-default-border)' },
      },
      DropdownV2: {
        menuWidthMode: { value: 'matchField' },
        menuCustomWidth: { value: '256' },
      },
    };

    const defaults = defaultStylesByComponent[componentType];
    if (defaults) {
      for (const [key, value] of Object.entries(defaults)) {
        if (!styles[key]) {
          styles[key] = value;
        }
      }
    }

    // Radio Button V2
    if (componentType === 'RadioButtonV2') {
      if (properties.layout === undefined) {
        properties.layout = { value: 'wrap' };
      }
    }
  }
  // Check if the component type is included in the specified component types
  if (componentTypes.includes(componentType as NewRevampedComponent)) {
    if (styles.visibility) {
      if (properties.visibility === undefined) {
        properties.visibility = styles.visibility;
      }
      delete styles.visibility;
    }

    if (styles.disabledState) {
      if (properties.disabledState === undefined) {
        properties.disabledState = styles.disabledState;
      }
      delete styles.disabledState;
    }

    if (general?.tooltip) {
      if (properties.tooltip === undefined) {
        properties.tooltip = general?.tooltip;
      }
      delete general?.tooltip;
    }

    if (generalStyles?.boxShadow) {
      if (styles.boxShadow === undefined) {
        styles.boxShadow = generalStyles?.boxShadow;
      }
      delete generalStyles?.boxShadow;
    }

    // Set empty label for specific components
    if (
      (shouldHandleBackwardCompatibility && ['TextInput', 'PasswordInput', 'NumberInput'].includes(componentType)) ||
      (['TextArea', 'DaterangePicker', 'FilePicker'].includes(componentType) && !properties.label)
    ) {
      properties.label = '';
    }

    // NumberInput
    if (componentType === 'NumberInput') {
      if (properties.minValue) {
        if (validation.minValue === undefined) {
          validation.minValue = properties?.minValue;
        }
        delete properties.minValue;
      }

      if (properties.maxValue) {
        if (validation.maxValue === undefined) {
          validation.maxValue = properties?.maxValue;
        }
        delete properties.maxValue;
      }
    }

    if (componentType === 'Chat') {
      if (!styles.borderRadius) {
        styles.borderRadius = { value: 6 };
      }
    }

    // CircularProgressBar
    if (componentType === 'CircularProgressBar') {
      if (!properties.labelType) {
        properties.labelType = { value: 'custom' };
      }

      if (!properties.text || !properties.text.value) {
        properties.text = {
          ...properties.text,
          value: '',
        };
      }

      if (!styles.completionColor) {
        styles.completionColor = {
          ...styles.color,
        };
      }

      // When CircularProgressBar was released
      const backwordCompatibilityCheck = !isVersionGreaterThanOrEqual(tooljetVersion, '3.16.33');
      if (backwordCompatibilityCheck) {
        if (styles.textSize) {
          styles.textSize = {
            ...styles.textSize,
            fxActive: true,
          };
        }

        if (styles.strokeWidth) {
          styles.strokeWidth = {
            ...styles.strokeWidth,
            fxActive: true,
          };
        }

        if (styles.counterClockwise) {
          styles.counterClockwise = {
            ...styles.counterClockwise,
            fxActive: true,
          };
        }

        if (styles.circleRatio) {
          styles.circleRatio = {
            ...styles.circleRatio,
            fxActive: true,
          };
        }
      }
    }

    // Container
    if (componentType === 'Container') {
      properties.showHeader = properties?.showHeader || false;
    }

    //Tags
    if (componentType === 'Tags') {
      if (!('advanced' in properties)) {
        properties.advanced = { value: '{{true}}' };
      }
    }

    // Form
    if (componentType === 'Form') {
      properties.showHeader = properties?.showHeader || false;
      properties.showFooter = properties?.showFooter || false;
    }

    // Tabs
    if (componentType === 'Tabs') {
      if (properties.useDynamicOptions === undefined) {
        properties.useDynamicOptions = { value: true };
      }

      if (styles.highlightColor) {
        if (styles.selectedText === undefined) {
          styles.selectedText = styles.highlightColor;
        }
        if (styles.accent === undefined) {
          styles.accent = styles.highlightColor;
        }
        delete styles.highlightColor;
      }

      if (!styles.commonBackgroundColor) {
        styles.commonBackgroundColor = { value: 'var(--cc-surface1-surface)' };
      }
    }

    // Image
    if (componentType === 'Image') {
      if (styles.padding) {
        styles.customPadding = styles.padding;
        styles.padding = { value: 'custom' };
      }
    }

    // FilePicker
    if (componentType === 'FilePicker') {
      if (properties.enableDropzone) {
        properties.enableDropzone = {
          ...properties.enableDropzone,
          fxActive: properties?.enableDropzone?.fxActive ?? true,
        };
      }
      if (properties.enablePicker) {
        properties.enablePicker = {
          ...properties.enablePicker,
          fxActive: properties?.enablePicker?.fxActive ?? true,
        };
      }
      if (properties.enableMultiple) {
        properties.enableMultiple = {
          ...properties.enableMultiple,
          fxActive: properties?.enableMultiple?.fxActive ?? true,
        };
      }
      if (properties.fileType && !validation.fileType) {
        validation.fileType = {
          ...properties.fileType,
          fxActive: properties?.fileType?.fxActive ?? true,
        };
        delete properties.fileType;
      }

      if (properties.maxFileCount && !validation.maxFileCount) {
        validation.maxFileCount = {
          ...properties.maxFileCount,
          fxActive: properties?.fileType?.fxActive ?? true,
        };
        delete properties.maxFileCount;
      }
      if (properties.maxSize && !validation.maxSize) {
        validation.maxSize = {
          ...properties.maxSize,
          fxActive: properties?.maxSize?.fxActive ?? true,
        };
        delete properties.maxSize;
      }
      if (properties.minSize && !validation.minSize) {
        validation.minSize = {
          ...properties.minSize,
          fxActive: properties?.minSize?.fxActive ?? true,
        };
        delete properties.minSize;
      }

      if (!validation.minFileCount) {
        validation.minFileCount = { value: '{{0}}' };
      }
    }

    // Steps
    if (componentType === 'Steps') {
      if (!properties.advanced) {
        properties.advanced = { value: '{{true}}' };
      }
      if (properties.steps && !properties.schema) {
        properties.schema = properties.steps;
        delete properties.steps;
      }
    }

    // Statistics
    if (componentType === 'Statistics') {
      properties.dataAlignment ??= { value: 'center' };
      properties.secondaryValueAlignment ??= { value: 'vertical' };

      styles.iconVisibility ??= { value: false };

      if (styles.secondaryTextColour) {
        styles.positiveSecondaryValueColor = styles.secondaryTextColour;
        styles.negativeSecondaryValueColor = styles.secondaryTextColour;
        delete styles.secondaryTextColour;
      }
    }

    // StarRating
    if (componentType === 'StarRating') {
      if (!styles.labelStyle) {
        styles.labelStyle = { value: 'legacy' };
      }
    }

    // CurrencyInput
    if (componentType === 'CurrencyInput') {
      if (properties.showFlag == undefined) {
        properties.showFlag = { value: true };
      }
      if (properties.numberFormat == undefined) {
        properties.numberFormat = { value: 'us' };
      }
    }

    // TreeSelect
    if (componentType === 'TreeSelect') {
      if (!styles.labelColor) {
        styles.labelColor = styles?.textColor;
      }
      if (styles.labelStyle === undefined) {
        styles.labelStyle = { value: 'legacy' };
      }
      if (!styles.alignment) {
        styles.alignment = { value: 'top' };
        styles.direction = { value: 'left' };
      }
      if (properties.advanced === undefined) {
        properties.advanced = { value: true };
      }
    }

    if (SHOW_CLEAR_BTN_COMPONENT_TYPES.includes(componentType) && properties.showClearBtn === undefined) {
      properties.showClearBtn = { value: '{{false}}' };
    }
    if (componentType === 'Button') {
      if (styles.textSize === undefined) {
        styles.textSize = { value: '{{14}}' };
      }
      if (styles.fontWeight === undefined) {
        styles.fontWeight = { value: 'normal' };
      }
      if (styles.contentAlignment === undefined) {
        styles.contentAlignment = { value: 'center' };
      }
      if (styles.hoverBackgroundColor === undefined) {
        styles.hoverBackgroundColor = { value: 'var(--cc-primary-brand)' };
      }
      if (styles.hoverBackgroundMode === undefined) {
        styles.hoverBackgroundMode = { value: 'auto' };
      }
    }

    if (componentType === 'ButtonGroupV2') {
      if (styles.textSize === undefined) {
        styles.textSize = { value: '{{14}}' };
      }
      if (styles.fontWeight === undefined) {
        styles.fontWeight = { value: 'normal' };
      }
      if (styles.hoverBackgroundColor === undefined) {
        styles.hoverBackgroundColor = { value: 'var(--cc-primary-brand)' };
      }
      if (styles.hoverBackgroundMode === undefined) {
        styles.hoverBackgroundMode = { value: 'auto' };
      }
    }

    if (componentType === 'ModalV2') {
      if (styles.triggerButtonTextSize === undefined) {
        styles.triggerButtonTextSize = { value: '{{14}}' };
      }
      if (styles.triggerButtonFontWeight === undefined) {
        styles.triggerButtonFontWeight = { value: 'normal' };
      }
      if (styles.triggerButtonContentAlignment === undefined) {
        styles.triggerButtonContentAlignment = { value: 'center' };
      }
      if (styles.triggerButtonHoverBackgroundColor === undefined) {
        styles.triggerButtonHoverBackgroundColor = { value: 'var(--cc-primary-brand)' };
      }
      if (styles.triggerButtonHoverBackgroundMode === undefined) {
        styles.triggerButtonHoverBackgroundMode = { value: 'auto' };
      }
    }

    if (componentType === 'PopoverMenu') {
      if (styles.textSize === undefined) {
        styles.textSize = { value: '{{14}}' };
      }
      if (styles.fontWeight === undefined) {
        styles.fontWeight = { value: 'normal' };
      }
      if (styles.contentAlignment === undefined) {
        styles.contentAlignment = { value: 'center' };
      }
      if (styles.hoverBackgroundColor === undefined) {
        styles.hoverBackgroundColor = { value: 'var(--cc-primary-brand)' };
      }
      if (styles.hoverBackgroundMode === undefined) {
        styles.hoverBackgroundMode = { value: 'auto' };
      }
    }

    const placeholderDefault = PLACEHOLDER_DATE_TIME_COMPONENT[componentType];
    if (placeholderDefault && properties.placeholder === undefined) {
      properties.placeholder = { value: placeholderDefault };
    }

    if (PLACEHOLDER_TEXT_COLOR_COMPONENT_TYPES.includes(componentType) && styles.placeholderTextColor === undefined) {
      styles.placeholderTextColor = { value: 'var(--cc-placeholder-text)' };
    }

    // DropdownV2
    if (componentType === 'DropdownV2') {
      if (!styles.menuWidthMode) {
        styles.menuWidthMode = { value: 'matchField' };
      }
      if (!styles.menuCustomWidth) {
        styles.menuCustomWidth = { value: '256' };
      }
    }

    // Listview
    if (componentType === 'Listview') {
      if (properties.loadingState === undefined) {
        properties.loadingState = { value: '{{false}}' };
      }
      if (properties.tooltip === undefined) {
        properties.tooltip = { value: '' };
      }
    }

    // Pagination
    if (componentType === 'Pagination') {
      if (properties.loadingState === undefined) {
        properties.loadingState = { value: '{{false}}' };
      }
    }
  }

  // To support backward compatibility, we are setting widthType to deprecated value ofField for input widget types
  if (INPUT_WIDGET_TYPES.includes(componentType)) {
    if (!styles.widthType) {
      styles.widthType = { value: 'ofField' };
    }
  }

  // TODO: Once the Kanban component is revamped, remove this logic and add 'Kanban' to the NewRevampedComponent array.
  // The migration for Kanban will then be handled automatically along with other revamped components.
  if (['Kanban'].includes(componentType)) {
    if (general?.tooltip) {
      if (properties.tooltip === undefined) {
        properties.tooltip = general?.tooltip;
      }
      delete general?.tooltip;
    }
  }

  if (componentType === 'ModuleViewer' && styles.padding === undefined) {
    styles.padding = { value: 'default' };
  }

  return { properties, styles, general, generalStyles, validation };
}

function transformComponentData(
  data: object,
  componentEvents: any[],
  componentsMapping: Record<string, string>,
  isNormalizedAppDefinitionSchema = true,
  tooljetVersion: string,
  moduleResourceMappings?: Record<string, unknown>,
  dataQueryMapping?: Record<string, string>,
  isGitApp = false
): Component[] {
  const transformedComponents: Component[] = [];

  const allComponents = Object.keys(data).map((key) => {
    return {
      id: key,
      ...data[key],
    };
  });

  for (const componentId in data) {
    const component = data[componentId];
    const componentData = component['component'];

    let skipComponent = false;
    const transformedComponent: Component = new Component();

    let parentId = component.parent ? component.parent : null;

    // Preserve virtual container parents (canvas-header, canvas-footer) as-is
    // These are not UUID-based and should not be remapped
    if (parentId !== 'canvas-header' && parentId !== 'canvas-footer') {
      const isParentTabOrCalendar = isChildOfTabsOrCalendar(
        component,
        allComponents,
        parentId,
        isNormalizedAppDefinitionSchema
      );

      if (isParentTabOrCalendar) {
        const childTabId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[2] : null;
        const _parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;
        const mappedParentId = componentsMapping[_parentId];

        parentId = `${mappedParentId}-${childTabId}`;
      } else if (isChildOfKanbanModal(component, allComponents, parentId, isNormalizedAppDefinitionSchema)) {
        const _parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;
        const mappedParentId = componentsMapping[_parentId];

        parentId = `${mappedParentId}-modal`;
      } else {
        if (component.parent && !componentsMapping[parentId]) {
          skipComponent = true;
        }
        parentId = componentsMapping[parentId];
      }
    }

    if (!skipComponent) {
      const { properties, styles, general, validation, generalStyles } = migrateProperties(
        componentData.component,
        componentData.definition,
        NewRevampedComponents,
        tooljetVersion
      );
      transformedComponent.id = uuid();
      transformedComponent.name = componentData.name;
      transformedComponent.type = componentData.component;
      transformedComponent.styles = styles || {};
      transformedComponent.validation = validation || {};
      transformedComponent.general = general || {};
      transformedComponent.generalStyles = generalStyles || {};
      transformedComponent.displayPreferences = componentData.definition.others || {};
      transformedComponent.parent = component.parent ? parentId : null;

      if (componentData.component === 'ModuleViewer' && moduleResourceMappings && !isGitApp) {
        // moduleVersionId.value is a portable module_reference_id — no rewrite needed.
        // Only the app id may need remapping for non-git imports.
        if (properties.moduleAppId?.value && moduleResourceMappings.moduleApps) {
          const oldAppId = properties.moduleAppId.value;
          if (moduleResourceMappings.moduleApps[oldAppId]) {
            properties.moduleAppId.value = moduleResourceMappings.moduleApps[oldAppId];
          }
        }
      }
      transformedComponent.properties = properties || {};
      transformedComponents.push(transformedComponent);

      componentEvents.push({
        componentId: componentId,
        event: componentData.definition.events,
      });
      componentsMapping[componentId] = transformedComponent.id;
    }
  }

  return transformedComponents;
}

const isChildOfTabsOrCalendar = (
  component,
  allComponents = [],
  componentParentId = undefined,
  isNormalizedAppDefinitionSchema: boolean
) => {
  if (componentParentId) {
    const parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;

    const parentComponent = allComponents.find((comp) => comp.id === parentId);

    if (parentComponent) {
      if (!isNormalizedAppDefinitionSchema) {
        return parentComponent.component.component === 'Tabs' || parentComponent.component.component === 'Calendar';
      }

      return parentComponent.type === 'Tabs' || parentComponent.type === 'Calendar';
    }
  }

  return false;
};

const isChildOfKanbanModal = (
  component,
  allComponents = [],
  componentParentId = undefined,
  isNormalizedAppDefinitionSchema: boolean
) => {
  if (!componentParentId || !componentParentId.includes('modal')) return false;

  const parentId = component?.parent ? component.parent?.match(/([a-fA-F0-9-]{36})-(.+)/)?.[1] : null;

  const parentComponent = allComponents.find((comp) => comp.id === parentId);

  if (!isNormalizedAppDefinitionSchema) {
    return parentComponent.component.component === 'Kanban';
  }

  return parentComponent?.type === 'Kanban';
};

const applyPageSettingsMigration = async (manager: EntityManager, appVersionIds: string[]) => {
  const appVersions = await manager.find(AppVersion, {
    where: {
      id: In(appVersionIds),
    },
    select: ['id', 'pageSettings', 'globalSettings'],
  });

  for (const version of appVersions) {
    let pageSettings = version.pageSettings as any;
    const globalSettings = version.globalSettings as any;

    // Only run migration for apps that have hideHeader in globalSettings (legacy apps)
    const needsMigration = globalSettings && 'hideHeader' in globalSettings;

    if (!needsMigration) {
      continue; // Skip migration - either new app or already migrated
    }

    if (!pageSettings) {
      pageSettings = { properties: {} };
    }
    if (!pageSettings.properties) {
      pageSettings.properties = {};
    }

    if (!('position' in pageSettings.properties)) {
      pageSettings.properties.position = 'side';
    }

    if (globalSettings && 'hideHeader' in globalSettings) {
      pageSettings.properties.hideHeader = globalSettings.hideHeader;
      pageSettings.properties.hideLogo = globalSettings.hideHeader;
      delete globalSettings.hideHeader;
    }

    await manager.update(
      AppVersion,
      { id: version.id },
      {
        pageSettings: pageSettings,
        globalSettings: globalSettings,
      }
    );
  }
};
