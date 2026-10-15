import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { App } from '@entities/app.entity';
import { buildSnapshot, VersionRows } from './snapshot';
import { diffVersions } from './version-diff';
import { VersionDiff, VersionSnapshot } from './types';
import { VersionSnapshotStore } from './snapshot-store';

@Injectable()
export class VersionDiffService {
  async diff(
    app: App,
    targetVersionId: string,
    baseVersionId: string,
    includeUnchanged = false,
    baseSnapshotId?: string
  ): Promise<VersionDiff> {
    if (!baseVersionId && !baseSnapshotId)
      throw new BadRequestException('Pass ?base=<versionId> or ?baseSnapshot=<snapshotId> to compare against');
    return dbTransactionWrap(async (manager: EntityManager) => {
      const store = new VersionSnapshotStore();
      const [base, target] = await Promise.all([
        baseSnapshotId
          ? store.snapshot(manager, app.id, baseSnapshotId)
          : this.snapshot(manager, app.id, baseVersionId),
        this.snapshot(manager, app.id, targetVersionId),
      ]);
      const result = diffVersions(base, target, { includeUnchanged });
      if (baseSnapshotId) {
        const stored = await store.load(manager, app.id, baseSnapshotId);
        return {
          ...result,
          base: {
            ...result.base,
            snapshot: { versionId: stored.versionId, reason: stored.reason, createdAt: stored.createdAt },
          },
        };
      }
      return result;
    });
  }

  // What the blueprint renderer needs to draw a page without running it:
  // every component's box, parent, type and a short label.
  async layout(app: App, source: { versionId?: string; snapshotId?: string }, pageKey?: string) {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const snapshot = source.snapshotId
        ? await new VersionSnapshotStore().snapshot(manager, app.id, source.snapshotId)
        : await this.snapshot(manager, app.id, source.versionId);
      const page =
        snapshot.pages.find((item) => item.key === pageKey) ??
        snapshot.pages.find((item) => item.key === snapshot.homePage) ??
        snapshot.pages[0];
      const unwrap = (value: any) => (value && typeof value === 'object' && 'value' in value ? value.value : value);
      const label = (properties: Record<string, any>) => {
        for (const key of ['text', 'label', 'title', 'buttonText', 'placeholder']) {
          const value = unwrap(properties?.[key]);
          if (typeof value === 'string' && value.trim() && !value.includes('{{')) return value.trim().slice(0, 80);
        }
        return null;
      };
      return {
        pages: snapshot.pages.map((item) => ({ key: item.key, name: item.name })),
        page: page ? { key: page.key, name: page.name } : null,
        components: snapshot.components
          .filter((component) => component.pageKey === page?.key)
          .map((component) => ({
            key: component.key,
            id: component.id,
            name: component.name,
            type: component.type,
            parent: component.parent,
            layouts: component.layouts,
            label: label(component.properties),
            hidden:
              unwrap(component.properties?.visibility) === '{{false}}' ||
              unwrap(component.properties?.visibility) === false,
            flex: /Flex/.test(component.type)
              ? {
                  direction:
                    unwrap(component.properties?.direction) ?? unwrap(component.properties?.flexDirection) ?? 'row',
                  childOrder: (unwrap(component.properties?.childOrder) ?? []).map((ref: string) =>
                    String(ref).replace(/^@component:/, '')
                  ),
                }
              : null,
          })),
      };
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
