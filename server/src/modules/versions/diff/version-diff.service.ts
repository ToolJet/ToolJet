import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { buildSnapshot, VersionRows } from './snapshot';
import { diffVersions } from './version-diff';
import { VersionDiff, VersionSnapshot } from './types';

@Injectable()
export class VersionDiffService {
  async diff(app: App, targetVersionId: string, baseVersionId: string, includeUnchanged = false): Promise<VersionDiff> {
    if (!baseVersionId) throw new BadRequestException('Pass the version to compare against as ?base=<versionId>');
    return dbTransactionWrap(async (manager: EntityManager) => {
      const [base, target] = await Promise.all([
        this.snapshot(manager, app.id, baseVersionId),
        this.snapshot(manager, app.id, targetVersionId),
      ]);
      return diffVersions(base, target, { includeUnchanged });
    });
  }

  async snapshot(manager: EntityManager, appId: string, versionId: string): Promise<VersionSnapshot> {
    return buildSnapshot(await this.loadRows(manager, appId, versionId));
  }

  // Plain reads over the normalized tables. One query per table keeps this
  // cheap even for a 30-page app (a few thousand rows at most).
  async loadRows(manager: EntityManager, appId: string, versionId: string): Promise<VersionRows> {
    const [version] = await manager.query(
      `SELECT id, name, status, home_page_id AS "homePageId", show_viewer_navigation AS "showViewerNavigation",
              global_settings AS "globalSettings", page_settings AS "pageSettings"
         FROM app_versions WHERE id = $1 AND app_id = $2`,
      [versionId, appId]
    );
    if (!version) throw new NotFoundException(`Version ${versionId} does not belong to this app`);

    const [pages, components, layouts, queries, dataSources, events] = await Promise.all([
      manager.query(
        `SELECT id, name, page_handle AS handle, index, disabled, hidden, icon, is_page_group AS "isPageGroup",
                page_group_id AS "pageGroupId", page_group_index AS "pageGroupIndex", auto_compute_layout AS "autoComputeLayout",
                page_header AS "pageHeader", page_footer AS "pageFooter", type, url
           FROM pages WHERE app_version_id = $1`,
        [versionId]
      ),
      manager.query(
        `SELECT c.id, c.name, c.type, c.page_id AS "pageId", c.parent, c.properties, c.styles,
                c.general_properties AS general, c.general_styles AS "generalStyles",
                c.display_preferences AS "displayPreferences", c.validation
           FROM components c JOIN pages p ON p.id = c.page_id WHERE p.app_version_id = $1`,
        [versionId]
      ),
      manager.query(
        `SELECT l.component_id AS "componentId", l.type, l.top, l.left, l.width, l.height,
                l.dimension_unit AS "dimensionUnit", l.width_px AS "widthPx", l.fill_width AS "fillWidth", l.grow
           FROM layouts l JOIN components c ON c.id = l.component_id JOIN pages p ON p.id = c.page_id
          WHERE p.app_version_id = $1`,
        [versionId]
      ),
      manager.query(
        `SELECT id, name, data_source_id AS "dataSourceId", options FROM data_queries WHERE app_version_id = $1`,
        [versionId]
      ),
      manager.query(
        `SELECT DISTINCT ds.id, ds.name, ds.kind FROM data_sources ds
           JOIN data_queries q ON q.data_source_id = ds.id WHERE q.app_version_id = $1`,
        [versionId]
      ),
      manager.query(
        `SELECT id, name, index, event, source_id AS "sourceId", target FROM event_handlers WHERE app_version_id = $1`,
        [versionId]
      ),
    ]);

    return { version, pages, components, layouts, queries, dataSources, events };
  }
}
