import {
  BadRequestException,
  ConflictException,
  GoneException,
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
// Kept per version and reason, so Undo backups never push out the snapshots that
// older "See what changed" buttons point to. A missing snapshot reads as 410 Gone.
const KEEP_PER_VERSION: Record<string, number> = { ai_turn: 100, before_restore: 20 };
const KEEP_OTHER = 20;
// An app can have many drafts, each with its own history: the app as a whole is bounded too.
const KEEP_PER_APP: Record<string, number> = { ai_turn: 300, before_restore: 60 };
const KEEP_OTHER_PER_APP = 60;

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
      `DELETE FROM app_version_snapshots WHERE version_id = $1 AND reason = $2 AND id NOT IN (
         SELECT id FROM app_version_snapshots WHERE version_id = $1 AND reason = $2 ORDER BY created_at DESC LIMIT $3)`,
      [input.versionId, input.reason, KEEP_PER_VERSION[input.reason] ?? KEEP_OTHER]
    );
    await manager.query(
      `DELETE FROM app_version_snapshots WHERE app_id = $1 AND reason = $2 AND id NOT IN (
         SELECT id FROM app_version_snapshots WHERE app_id = $1 AND reason = $2 ORDER BY created_at DESC LIMIT $3)`,
      [input.appId, input.reason, KEEP_PER_APP[input.reason] ?? KEEP_OTHER_PER_APP]
    );
    return { id, fingerprint };
  }

  async load(manager: EntityManager, appId: string, snapshotId: string): Promise<StoredSnapshot> {
    const [row] = await manager.query(
      `SELECT id, version_id AS "versionId", reason, ref_id AS "refId", fingerprint, created_at AS "createdAt", content
         FROM app_version_snapshots WHERE id = $1 AND app_id = $2`,
      [snapshotId, appId]
    );
    if (!row)
      throw new GoneException(
        'This edit is too old to compare: ToolJet keeps the last 100 AI edits of each version, and none of a deleted version.'
      );
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
    // Undo writes to the version, so it follows the editor's freeze rules: no saved, released or
    // promoted version, and nothing that git sync has locked. The row stays locked until the
    // restore commits, so two Undos on one version run one after the other.
    const [version] = await manager.query(
      `SELECT v.status, a.current_version_id = v.id AS "isReleased", e.priority, g.allow_editing AS "gitAllowsEditing"
         FROM app_versions v JOIN apps a ON a.id = v.app_id
         LEFT JOIN app_environments e ON e.id = v.current_environment_id
         LEFT JOIN app_git_sync g ON g.app_id = v.app_id
        WHERE v.id = $1 AND v.app_id = $2
          FOR UPDATE OF v`,
      [versionId, input.appId]
    );
    if (!version) throw new NotFoundException('The version this snapshot belongs to no longer exists');
    // An AI build writes into the app as it goes: undoing under it would interleave the two.
    // Runs refresh their heartbeat while alive; one silent for two minutes has ended.
    const [building] = await manager.query(
      `SELECT 1 AS running FROM ai_active_runs r JOIN ai_conversations c ON c.id = r.conversation_id
        WHERE c.app_id = $1 AND r.heartbeat_at > now() - interval '2 minutes' LIMIT 1`,
      [input.appId]
    );
    if (building) throw new ConflictException('ToolJet AI is building in this app. Undo once the build finishes.');
    if (version.status === 'PUBLISHED')
      throw new BadRequestException(
        'This version is saved, so it cannot be changed. Create a draft from it to undo there.'
      );
    if (version.isReleased) throw new BadRequestException('This version is live, so it cannot be changed here.');
    if (version.priority > 1)
      throw new BadRequestException('This version has been promoted, so it is locked. Undo it in a new draft.');
    if (version.gitAllowsEditing === false)
      throw new BadRequestException('Git sync locks this app for editing, so the edit cannot be undone here.');

    // Fingerprint the snapshot with today's rules; the stored one may predate a rule change.
    const wanted = contentFingerprint(buildSnapshot(rows));
    const current = await this.fingerprintOf(manager, input.appId, versionId);
    if (current === wanted) return { restored: false, versionId, reason: 'Already matches the snapshot' };
    // A fingerprint recorded under older rules (another prefix) cannot be compared, so there is no
    // way to know whether the version changed after the edit: refuse rather than risk losing work.
    const sameRules = input.expectedFingerprint?.split(':')[0] === current.split(':')[0];
    if (input.expectedFingerprint && !sameRules)
      throw new ConflictException(
        'This edit was recorded before an update to how ToolJet compares versions, so Undo cannot check that nothing changed since.'
      );
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
        // app_id is the target of an "app" link page, not this app. Older snapshots did not keep it or
        // open_in: a re-created page then takes the column defaults, an existing one keeps its own.
        `INSERT INTO pages (id, app_version_id, app_id, name, page_handle, index, disabled, hidden, icon, is_page_group,
           page_group_id, page_group_index, auto_compute_layout, page_header, page_footer, type, url, open_in)
         VALUES ($1, $2, COALESCE($3, ''), $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
           COALESCE($16, 'default')::page_type_enum, $17, COALESCE($18, 'new_tab')::page_open_in_enum)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, page_handle = EXCLUDED.page_handle, index = EXCLUDED.index,
           disabled = EXCLUDED.disabled, hidden = EXCLUDED.hidden, icon = EXCLUDED.icon, is_page_group = EXCLUDED.is_page_group,
           page_group_id = EXCLUDED.page_group_id, page_group_index = EXCLUDED.page_group_index,
           auto_compute_layout = EXCLUDED.auto_compute_layout, page_header = EXCLUDED.page_header,
           page_footer = EXCLUDED.page_footer, type = EXCLUDED.type, url = EXCLUDED.url,
           app_id = COALESCE($3, pages.app_id), open_in = COALESCE($18::page_open_in_enum, pages.open_in), updated_at = now()`,
        [
          page.id,
          versionId,
          page.linkAppId ?? null,
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
          page.openIn ?? null,
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
        // Older snapshots did not keep min widths; leave an existing value alone then.
        'minWidthPx' in layout ? (layout.minWidthPx ?? null) : undefined,
      ];
      const keepMin = params[10] === undefined;
      const updated = await manager.query(
        `UPDATE layouts SET top = $3, "left" = $4, width = $5, height = $6, dimension_unit = $7::dimension_unit,
           width_px = $8, fill_width = $9, grow = $10, ${keepMin ? '' : 'min_width_px = $11,'} updated_at = now()
         WHERE component_id = $1 AND type = $2::layout_type RETURNING id`,
        keepMin ? params.slice(0, 10) : params
      );
      const count = Array.isArray(updated?.[0]) ? updated[0].length : updated.length;
      if (!count)
        await manager.query(
          `INSERT INTO layouts (component_id, type, top, "left", width, height, dimension_unit, width_px, fill_width, grow, min_width_px)
           VALUES ($1, $2::layout_type, $3, $4, $5, $6, $7::dimension_unit, $8, $9, $10, $11)`,
          keepMin ? [...params.slice(0, 10), null] : params
        );
    }

    // Queries and events. Folder mappings do not cascade with their query, so they go first.
    await manager.query(
      `DELETE FROM data_query_folder_mappings WHERE child_type = 'query' AND child_id IN (
         SELECT id FROM data_queries WHERE app_version_id = $1 AND NOT (id = ANY($2::uuid[])))`,
      [versionId, ids(rows.queries)]
    );
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

    if (rows.queryFolders) {
      await manager.query(
        `DELETE FROM data_query_folder_mappings WHERE child_type = 'query' AND child_id = ANY($1::uuid[])`,
        [ids(rows.queries)]
      );
      for (const mapping of rows.queryFolders)
        await manager.query(
          `INSERT INTO data_query_folder_mappings (id, parent_id, child_id, child_type, index)
           SELECT $1, $2, $3, 'query', $4 WHERE EXISTS (SELECT 1 FROM data_query_folders WHERE id = $2)`,
          [mapping.id, mapping.parentId, mapping.childId, mapping.index]
        );
    }

    // Access rules: put back exactly what the snapshot had on every page, component and query,
    // so a row the turn deleted does not come back open to everyone.
    if (rows.permissions) {
      const tables = {
        page: { rules: 'page_permissions', owner: 'page_id', users: 'page_users', link: 'page_permissions_id' },
        component: {
          rules: 'component_permissions',
          owner: 'component_id',
          users: 'component_users',
          link: 'component_permissions_id',
        },
        query: { rules: 'query_permissions', owner: 'query_id', users: 'query_users', link: 'query_permissions_id' },
      } as const;
      const owners = { page: ids(rows.pages), component: ids(rows.components), query: ids(rows.queries) };
      for (const kind of Object.keys(tables) as Array<keyof typeof tables>) {
        const t = tables[kind];
        await manager.query(`DELETE FROM ${t.rules} WHERE ${t.owner} = ANY($1::uuid[])`, [owners[kind]]);
        for (const rule of rows.permissions.filter((item) => item.kind === kind)) {
          await manager.query(
            `INSERT INTO ${t.rules} (id, ${t.owner}, type) VALUES ($1, $2, $3::${t.rules}_type_enum)`,
            [rule.id, rule.ownerId, rule.type]
          );
          for (const user of rule.users ?? [])
            // A user or group removed since the snapshot is skipped rather than failing the undo.
            await manager.query(
              `INSERT INTO ${t.users} (id, ${t.link}, user_id, permission_groups_id)
               SELECT $1, $2, $3, $4
                WHERE ($3::uuid IS NULL OR EXISTS (SELECT 1 FROM users WHERE id = $3))
                  AND ($4::uuid IS NULL OR EXISTS (SELECT 1 FROM permission_groups WHERE id = $4))`,
              [user.id, rule.id, user.userId, user.groupId]
            );
        }
      }
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
