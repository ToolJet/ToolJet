import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { VersionDiffService } from './version-diff.service';
import { buildSnapshot, VersionRows } from './snapshot';
import { contentFingerprint } from './fingerprint';
import { VersionSnapshot } from './types';

// Stored snapshots keep the raw rows (VersionRows), not the built snapshot, so
// a later change to the diff rules applies to old snapshots too.
const KEEP_PER_VERSION = 30;

export type StoredSnapshot = {
  id: string;
  versionId: string;
  reason: string;
  refId: string | null;
  fingerprint: string;
  createdAt: string;
  rows: VersionRows;
};

export class VersionSnapshotStore {
  private readonly diffs = new VersionDiffService();

  async capture(
    manager: EntityManager,
    input: { organizationId: string; appId: string; versionId: string; reason: string; refId?: string; userId?: string }
  ): Promise<{ id: string; fingerprint: string }> {
    const rows = await this.diffs.loadRows(manager, input.appId, input.versionId);
    const fingerprint = contentFingerprint(buildSnapshot(rows));
    const [{ id }] = await manager.query(
      `INSERT INTO app_version_snapshots (organization_id, app_id, version_id, reason, ref_id, fingerprint, content, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        input.organizationId,
        input.appId,
        input.versionId,
        input.reason,
        input.refId ?? null,
        fingerprint,
        JSON.stringify(rows),
        input.userId ?? null,
      ]
    );
    // Bounded history per version; the newest ones are the ones people open.
    await manager.query(
      `DELETE FROM app_version_snapshots WHERE version_id = $1 AND id NOT IN (
         SELECT id FROM app_version_snapshots WHERE version_id = $1 ORDER BY created_at DESC LIMIT ${KEEP_PER_VERSION})`,
      [input.versionId]
    );
    return { id, fingerprint };
  }

  async load(manager: EntityManager, appId: string, snapshotId: string): Promise<StoredSnapshot> {
    const [row] = await manager.query(
      `SELECT id, version_id AS "versionId", reason, ref_id AS "refId", fingerprint, created_at AS "createdAt", content
         FROM app_version_snapshots WHERE id = $1 AND app_id = $2`,
      [snapshotId, appId]
    );
    if (!row) throw new NotFoundException('Snapshot not found');
    const rows = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
    return { ...row, rows };
  }

  async snapshot(manager: EntityManager, appId: string, snapshotId: string): Promise<VersionSnapshot> {
    const stored = await this.load(manager, appId, snapshotId);
    // A snapshot is named after the moment, not the version it was taken from.
    return buildSnapshot({
      ...stored.rows,
      version: { ...stored.rows.version, id: stored.id, name: 'Before', status: null },
    });
  }

  /*
   * Puts a version back to a snapshot of itself (Undo this turn). Runs inside the caller's
   * transaction and refuses unless it can be exact:
   *  - only a draft (saved versions are locked);
   *  - only when the version is still what the caller saw (expectedFingerprint), so edits made
   *    after the snapshot's turn are never silently thrown away;
   *  - rows are upserted by id, so permissions and fields the snapshot does not carry survive on
   *    rows that still exist;
   *  - the current state is snapshotted first, so the undo can itself be undone;
   *  - the result is fingerprinted, and anything short of the snapshot's fingerprint rolls back.
   */
  async restore(
    manager: EntityManager,
    input: { appId: string; snapshotId: string; organizationId: string; userId?: string; expectedFingerprint?: string }
  ) {
    const stored = await this.load(manager, input.appId, input.snapshotId);
    const { versionId, rows } = { versionId: stored.versionId, rows: stored.rows };
    const [version] = await manager.query(`SELECT status FROM app_versions WHERE id = $1 AND app_id = $2`, [
      versionId,
      input.appId,
    ]);
    if (!version) throw new NotFoundException('The version this snapshot belongs to no longer exists');
    if (version.status === 'PUBLISHED')
      throw new BadRequestException(
        'This version is saved, so it cannot be changed. Create a draft from it to undo there.'
      );

    // Fingerprint the snapshot with today's rules; the stored one may predate a rule change.
    const wanted = contentFingerprint(buildSnapshot(rows));
    const current = await this.fingerprintOf(manager, input.appId, versionId);
    if (current === wanted) return { restored: false, versionId, reason: 'Already matches the snapshot' };
    if (input.expectedFingerprint && current !== input.expectedFingerprint)
      throw new ConflictException(
        'The version changed after this edit, so undoing it would also discard those changes.'
      );

    const backup = await this.capture(manager, {
      organizationId: input.organizationId,
      appId: input.appId,
      versionId,
      reason: 'before_restore',
      refId: input.snapshotId,
      userId: input.userId,
    });

    const json = (value: any) => (value == null ? null : JSON.stringify(value));
    const ids = (list: Array<{ id: string }>) => list.map((item) => item.id);
    const v = rows.version;
    await manager.query(
      `UPDATE app_versions SET global_settings = $2, page_settings = $3, home_page_id = $4, show_viewer_navigation = $5,
         updated_at = now() WHERE id = $1`,
      [versionId, json(v.globalSettings), json(v.pageSettings), v.homePageId, v.showViewerNavigation]
    );

    // Pages (deleting one cascades to its components and their layouts).
    await manager.query(`DELETE FROM pages WHERE app_version_id = $1 AND NOT (id = ANY($2::uuid[]))`, [
      versionId,
      ids(rows.pages),
    ]);
    for (const page of rows.pages) {
      await manager.query(
        `INSERT INTO pages (id, app_version_id, app_id, name, page_handle, index, disabled, hidden, icon, is_page_group,
           page_group_id, page_group_index, auto_compute_layout, page_header, page_footer, type, url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, COALESCE($16, 'default')::page_type_enum, $17)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, page_handle = EXCLUDED.page_handle, index = EXCLUDED.index,
           disabled = EXCLUDED.disabled, hidden = EXCLUDED.hidden, icon = EXCLUDED.icon, is_page_group = EXCLUDED.is_page_group,
           page_group_id = EXCLUDED.page_group_id, page_group_index = EXCLUDED.page_group_index,
           auto_compute_layout = EXCLUDED.auto_compute_layout, page_header = EXCLUDED.page_header,
           page_footer = EXCLUDED.page_footer, type = EXCLUDED.type, url = EXCLUDED.url, updated_at = now()`,
        [
          page.id,
          versionId,
          input.appId,
          page.name,
          page.handle,
          page.index,
          page.disabled,
          json(page.hidden),
          page.icon,
          page.isPageGroup,
          page.pageGroupId,
          page.pageGroupIndex ?? null,
          page.autoComputeLayout,
          json(page.pageHeader),
          json(page.pageFooter),
          page.type,
          page.url,
        ]
      );
    }

    // Components.
    await manager.query(
      `DELETE FROM components WHERE page_id IN (SELECT id FROM pages WHERE app_version_id = $1) AND NOT (id = ANY($2::uuid[]))`,
      [versionId, ids(rows.components)]
    );
    for (const component of rows.components) {
      await manager.query(
        `INSERT INTO components (id, name, type, page_id, parent, properties, styles, general_properties, general_styles,
           display_preferences, validation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, page_id = EXCLUDED.page_id,
           parent = EXCLUDED.parent, properties = EXCLUDED.properties, styles = EXCLUDED.styles,
           general_properties = EXCLUDED.general_properties, general_styles = EXCLUDED.general_styles,
           display_preferences = EXCLUDED.display_preferences, validation = EXCLUDED.validation, updated_at = now()`,
        [
          component.id,
          component.name,
          component.type,
          component.pageId,
          component.parent,
          json(component.properties),
          json(component.styles),
          json(component.general),
          json(component.generalStyles),
          json(component.displayPreferences),
          json(component.validation),
        ]
      );
    }

    // Layouts: one per component and type, last row wins (as the snapshot reads them).
    const boxes = new Map<string, VersionRows['layouts'][number]>();
    for (const layout of rows.layouts) boxes.set(`${layout.componentId}:${layout.type}`, layout);
    const typesByComponent = new Map<string, string[]>();
    for (const layout of boxes.values())
      typesByComponent.set(layout.componentId, [...(typesByComponent.get(layout.componentId) ?? []), layout.type]);
    for (const component of rows.components) {
      await manager.query(`DELETE FROM layouts WHERE component_id = $1 AND NOT (type::text = ANY($2::text[]))`, [
        component.id,
        typesByComponent.get(component.id) ?? [],
      ]);
    }
    for (const layout of boxes.values()) {
      const params = [
        layout.componentId,
        layout.type,
        layout.top,
        layout.left,
        layout.width,
        layout.height,
        layout.dimensionUnit ?? 'count',
        layout.widthPx ?? null,
        layout.fillWidth ?? null,
        layout.grow ?? null,
      ];
      const updated = await manager.query(
        `UPDATE layouts SET top = $3, "left" = $4, width = $5, height = $6, dimension_unit = $7::dimension_unit,
           width_px = $8, fill_width = $9, grow = $10, updated_at = now()
         WHERE component_id = $1 AND type = $2::layout_type RETURNING id`,
        params
      );
      const count = Array.isArray(updated?.[0]) ? updated[0].length : updated.length;
      if (!count)
        await manager.query(
          `INSERT INTO layouts (component_id, type, top, "left", width, height, dimension_unit, width_px, fill_width, grow)
           VALUES ($1, $2::layout_type, $3, $4, $5, $6, $7::dimension_unit, $8, $9, $10)`,
          params
        );
    }

    // Queries and events.
    await manager.query(`DELETE FROM data_queries WHERE app_version_id = $1 AND NOT (id = ANY($2::uuid[]))`, [
      versionId,
      ids(rows.queries),
    ]);
    for (const query of rows.queries) {
      await manager.query(
        `INSERT INTO data_queries (id, name, data_source_id, options, app_version_id) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, data_source_id = EXCLUDED.data_source_id,
           options = EXCLUDED.options, updated_at = now()`,
        [query.id, query.name, query.dataSourceId, json(query.options), versionId]
      );
    }
    await manager.query(`DELETE FROM event_handlers WHERE app_version_id = $1`, [versionId]);
    for (const handler of rows.events) {
      await manager.query(
        `INSERT INTO event_handlers (id, name, index, event, source_id, target, app_version_id)
         VALUES ($1, $2, $3, $4, $5, $6::event_handlers_target_enum, $7)`,
        [handler.id, handler.name, handler.index, json(handler.event), handler.sourceId, handler.target, versionId]
      );
    }

    const after = await this.fingerprintOf(manager, input.appId, versionId);
    if (after !== wanted)
      throw new InternalServerErrorException('Undo could not put the version back exactly, so nothing was changed.');
    return { restored: true, versionId, backupSnapshotId: backup.id };
  }

  async fingerprintOf(manager: EntityManager, appId: string, versionId: string): Promise<string> {
    return contentFingerprint(buildSnapshot(await this.diffs.loadRows(manager, appId, versionId)));
  }
}
