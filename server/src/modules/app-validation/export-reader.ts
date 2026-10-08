import { ComponentWrite, EventWrite, LayoutWrite, QueryWrite, ValidationArea } from './types';
import { toIndexedEvent, VersionIndexData } from './version-index';

// Scoped by appVersionId: pooling versions reports fake duplicates.
export interface ExportedAppVersion {
  appId: string;
  appName: string;
  appType: string;
  toolJetVersion?: string;
  appVersionId: string;
  versionName?: string;
  homePageId: string | null;
  pages: any[];
  components: any[];
  events: any[];
  queries: any[];
  dataSources: any[];
}

// Includes modules nested under `appV2.modules`.
export function readAppVersionsFromExport(file: any): ExportedAppVersion[] {
  const entries = Array.isArray(file?.app) ? file.app : [file?.app].filter(Boolean);
  const apps = entries.map((entry: any) => entry?.definition?.appV2 ?? entry?.appV2 ?? entry).filter(Boolean);
  return apps.flatMap((appV2: any) => versionsOf(appV2, file?.tooljet_version));
}

function versionsOf(appV2: any, toolJetVersion?: string): ExportedAppVersion[] {
  const nested = (appV2.modules ?? [])
    .map((m: any) => m?.appV2 ?? m?.definition?.appV2 ?? m)
    .filter(Boolean)
    .flatMap((moduleApp: any) => versionsOf(moduleApp, toolJetVersion));

  const pages: any[] = appV2.pages ?? [];
  const components: any[] = appV2.components ?? [];
  const events: any[] = appV2.events ?? [];
  const queries: any[] = appV2.dataQueries ?? [];
  const dataSources: any[] = appV2.dataSources ?? [];
  const versions: any[] = appV2.appVersions?.length ? appV2.appVersions : [appV2.editingVersion].filter(Boolean);

  // Older exports don't tag rows with appVersionId; with one version everything belongs to it.
  const single = versions.length <= 1;
  const belongsTo = (row: any, versionId: string) => single || row?.appVersionId === versionId;

  const own = (versions.length ? versions : [{ id: appV2.editingVersion?.id ?? 'unknown' }]).map((version) => {
    const versionPages = pages.filter((p) => belongsTo(p, version.id));
    const pageIds = new Set(versionPages.map((p) => p.id));
    return {
      appId: appV2.id,
      appName: appV2.name,
      appType: appV2.type,
      toolJetVersion,
      appVersionId: version.id,
      versionName: version.name,
      homePageId:
        version.homePageId ??
        (appV2.editingVersion?.id === version.id ? appV2.editingVersion?.homePageId : null) ??
        null,
      pages: versionPages,
      components: components.filter((c) => pageIds.has(c.pageId)),
      events: events.filter((e) => belongsTo(e, version.id)),
      queries: queries.filter((q) => belongsTo(q, version.id)),
      dataSources: dataSources.filter((d) => belongsTo(d, version.id)),
    };
  });

  return [...own, ...nested];
}

export function toIndexData(version: ExportedAppVersion): VersionIndexData {
  return {
    components: version.components.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parent: c.parent ?? null,
      pageId: c.pageId,
    })),
    pages: version.pages.map((p) => ({
      id: p.id,
      name: p.name,
      handle: p.handle,
      isPageGroup: p.isPageGroup,
      pageGroupId: p.pageGroupId,
      disabled: p.disabled,
      hidden: p.hidden,
    })),
    queries: version.queries.map((q) => ({ id: q.id, name: q.name, dataSourceId: q.dataSourceId })),
    events: version.events.map((e) => toIndexedEvent(e)),
    dataSources: version.dataSources.map((d) => ({
      id: d.id,
      kind: d.kind,
      scope: d.scope,
      organizationId: d.organizationId ?? null,
    })),
    homePageId: version.homePageId,
  };
}

export function toComponentWrites(version: ExportedAppVersion): ComponentWrite[] {
  return version.components.map((c) => ({
    op: 'create',
    id: c.id,
    data: {
      name: c.name,
      type: c.type,
      pageId: c.pageId,
      parent: c.parent ?? null,
      properties: c.properties,
      styles: c.styles,
      general: c.general,
      generalStyles: c.generalStyles,
      validation: c.validation,
      displayPreferences: c.displayPreferences ?? c.others,
      layouts: c.layouts,
    },
  }));
}

// One write per stored layout row: (componentId, type). Old exports store `layouts` as an
// array of rows with a `type` field; newer ones as an object keyed by type.
export function toLayoutWrites(version: ExportedAppVersion): LayoutWrite[] {
  return version.components.flatMap((c) =>
    Object.entries(c.layouts ?? {}).map(([key, layout]: [string, any]) => ({
      op: 'create' as const,
      id: c.id,
      data: {
        componentId: c.id,
        type: layout?.type ?? key,
        top: layout?.top,
        left: layout?.left,
        width: layout?.width,
        height: layout?.height,
        widthPx: layout?.widthPx,
        fillWidth: layout?.fillWidth,
      },
    }))
  );
}

export function toEventWrites(version: ExportedAppVersion): EventWrite[] {
  return version.events.map((e) => ({
    op: 'create',
    id: e.id,
    data: {
      name: e.name,
      target: e.target,
      sourceId: e.sourceId,
      index: e.index,
      event: e.event,
    },
  }));
}

// Exports don't store `kind` on the query row; rules that need it skip.
export function toQueryWrites(version: ExportedAppVersion): QueryWrite[] {
  return version.queries.map((q) => ({
    op: 'create',
    id: q.id,
    data: {
      name: q.name,
      kind: q.kind,
      dataSourceId: q.dataSourceId,
      options: q.options,
    },
  }));
}

// Each work package adds its area here so imports validate it too.
export function inputsByArea(version: ExportedAppVersion): Partial<Record<ValidationArea, unknown[]>> {
  return {
    components: toComponentWrites(version),
    layouts: toLayoutWrites(version),
    events: toEventWrites(version),
    queries: toQueryWrites(version),
  };
}
