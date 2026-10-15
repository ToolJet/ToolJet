import { VersionRows } from "./snapshot";

// Turns the definition the viewer loads for a version into the definition of an
// AI-turn snapshot of that version, so the compare view can render the state
// before the edit with the real viewer instead of a layout outline.
//
// `live` is the response of the normal GET version call for the version the
// snapshot was taken from. App-level fields, the theme, modules and anything a
// snapshot does not carry come from it; pages, components, layouts, events and
// queries come from the snapshot. Rows that still exist keep their live extras
// (permissions, openIn); rows the edit removed are rebuilt from the snapshot.
export function overlaySnapshotDefinition(
  live: any,
  rows: VersionRows,
  versionId: string,
  withDefaults: (pages: any[]) => any[] = (pages) => pages,
) {
  const livePages = new Map<string, any>(
    (live.pages ?? []).map((page: any) => [page.id, page]),
  );
  const liveQueries = new Map<string, any>(
    (live.data_queries ?? []).map((query: any) => [query.id, query]),
  );
  const liveQueryBySource = new Map<string, any>(
    (live.data_queries ?? []).map((query: any) => [
      query.data_source_id,
      query,
    ]),
  );
  const sourceKind = new Map(
    rows.dataSources.map((source) => [source.id, source.kind]),
  );

  // Snapshots taken before min_width_px was captured fall back to the live layout of the same component.
  const liveLayout = (componentId: string, type: string) => {
    for (const page of live.pages ?? []) {
      const found = page.components?.[componentId]?.layouts?.[type];
      if (found) return found;
    }
    return null;
  };

  const layoutsByComponent = new Map<string, VersionRows["layouts"]>();
  for (const layout of rows.layouts) {
    if (layout.type !== "desktop" && layout.type !== "mobile") continue;
    const list = layoutsByComponent.get(layout.componentId) ?? [];
    list.push(layout);
    layoutsByComponent.set(layout.componentId, list);
  }

  // Same shape as ComponentsService.createComponentWithLayout.
  const componentsByPage = new Map<string, Record<string, any>>();
  for (const component of rows.components) {
    const layouts: Record<string, any> = {};
    for (const layout of layoutsByComponent.get(component.id) ?? []) {
      layouts[layout.type] = {
        top: layout.top ?? 0,
        left: layout.left ?? 0,
        width: layout.width ?? 0,
        height: layout.height ?? 0,
        updatedAt: null,
        ...(layout.widthPx != null ? { widthPx: layout.widthPx } : {}),
        ...(layout.fillWidth != null ? { fillWidth: layout.fillWidth } : {}),
        ...(layout.grow != null ? { grow: layout.grow } : {}),
      };
      const minWidthPx =
        "minWidthPx" in layout
          ? layout.minWidthPx
          : liveLayout(component.id, layout.type)?.minWidthPx;
      if (minWidthPx != null) layouts[layout.type].minWidthPx = minWidthPx;
    }
    const page = componentsByPage.get(component.pageId) ?? {};
    page[component.id] = {
      component: {
        name: component.name,
        component: component.type,
        definition: {
          properties: component.properties,
          styles: component.styles,
          generalStyles: component.generalStyles,
          validation: component.validation,
          general: component.general,
          others: component.displayPreferences,
        },
        parent: component.parent,
      },
      layouts,
    };
    componentsByPage.set(component.pageId, page);
  }

  // The viewer gets pages without page groups, in index order (PageHelperService.fetchPages).
  const pages = rows.pages
    .filter((page) => !page.isPageGroup)
    .sort((a, b) => a.index - b.index)
    .map((page) => ({
      ...(livePages.get(page.id) ?? { openIn: "same_tab", appId: live.id }),
      id: page.id,
      name: page.name,
      handle: page.handle,
      index: page.index,
      disabled: page.disabled,
      hidden: page.hidden,
      icon: page.icon,
      isPageGroup: false,
      pageGroupId: page.pageGroupId,
      pageGroupIndex: page.pageGroupIndex ?? null,
      autoComputeLayout: page.autoComputeLayout,
      pageHeader: page.pageHeader,
      pageFooter: page.pageFooter,
      type: page.type,
      url: page.url,
      components: componentsByPage.get(page.id) ?? {},
      restricted: false,
    }));

  const events = rows.events.map((event) => ({
    id: event.id,
    name: event.name,
    index: event.index,
    event: event.event,
    sourceId: event.sourceId,
    target: event.target,
    appVersionId: versionId,
  }));

  const dataQueries = rows.queries.map((query) => {
    const existing = liveQueries.get(query.id);
    const sibling = liveQueryBySource.get(query.dataSourceId);
    return {
      ...(existing ?? {}),
      id: query.id,
      name: query.name,
      data_source_id: query.dataSourceId,
      app_version_id: versionId,
      kind:
        existing?.kind ?? sourceKind.get(query.dataSourceId) ?? sibling?.kind,
      options: query.options,
      plugins: existing?.plugins ?? sibling?.plugins ?? [],
    };
  });

  // The theme is looked up per request and injected into globalSettings; keep it.
  const theme = live.editing_version?.globalSettings?.theme;
  const globalSettings = rows.version.globalSettings
    ? { ...rows.version.globalSettings, ...(theme ? { theme } : {}) }
    : live.editing_version?.globalSettings;

  return {
    ...live,
    editing_version: {
      ...live.editing_version,
      globalSettings,
      pageSettings:
        rows.version.pageSettings ?? live.editing_version?.pageSettings,
      homePageId: rows.version.homePageId ?? live.editing_version?.homePageId,
      showViewerNavigation: rows.version.showViewerNavigation,
    },
    // Stored rows carry only what was set; the viewer expects each widget's defaults merged in.
    pages: withDefaults(pages),
    events,
    data_queries: dataQueries,
    // A snapshot is a picture of the past: nothing about it can be edited.
    should_freeze_editor: true,
  };
}
