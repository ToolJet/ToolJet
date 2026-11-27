import {
  SIDEBAR_ITEMS,
  getPanelCloseLabel,
  PREVIEW_PANEL,
  QUERY_HEADER_PX,
  QUERY_TABS_PX,
  getRuntimeSearchName,
  getRuntimeToggleLabel,
  PANEL_MOTION,
  EDITOR_CANVAS_WIDTH,
  RUNTIME_PANEL_COLLAPSED_HEIGHT,
  RUNTIME_PANEL_ITEMS,
  getRuntimePanelContentStyle,
  getCanvasReservedBottom,
  getRuntimePanelCommittedHeight,
  getPastPanelOffset,
  getRuntimePanelTheme,
  getRightPanelForSelection,
  getPageSettingsSections,
  getLeftPanelOverflow,
  getLeftPanelState,
  getComponentPickerClassName,
  getQueryListClassName,
  getQueryPanelHeaderClassName,
  getQueryHeaderPlacement,
  getQueryAddButtonPresentation,
  getQueryPopoverMotion,
  QUERY_POPOVER_MOTION_TARGETS,
  TOOLJET_DB_MODE_OPTIONS,
  getTooljetDbModeControlPresentation,
  isQuerySearchPersistent,
  getQueryToolbarClassName,
  getQuerySearchClassName,
  getQuerySearchFocusStyle,
  getRightPanelClassName,
  getQueryManagerClassName,
  getRightPanelStyle,
  getRuntimePanelRightOffset,
  getRightPanelReservedWidth,
  getCanvasMinWidth,
  getRuntimeTabClickAction,
  getQueryDetailsClassName,
  isCodeQueryLayout,
  getQueryDetailsStyle,
  getAppBuilderTypographyVariables,
  getQueryDetailsOverflowStyle,
  QUERY_FIELD_LABEL_CLASS_NAME,
  QUERY_FIELD_HELPER_CLASS_NAME,
  getQueryTypographyClassName,
  getLeftPanelReservedBottom,
  getLeftPanelHeight,
  shouldShowLibraries,
  QUERY_PANEL_RESIZE,
  clampQueryPanelWidth,
  getQueryPanelWidth,
  parseStoredQueryPanelWidth,
} from '@/AppBuilder/panelLayout';
import fs from 'fs';
import path from 'path';

const queryManagerStyles = fs.readFileSync(path.resolve(__dirname, '../../_styles/queryManager.scss'), 'utf8');
const tooljetDbJoinTableSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/JoinTable.jsx'),
  'utf8'
);
const tooljetDbListRowsSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/ListRows.jsx'),
  'utf8'
);
const tooljetDbFilterSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/RenderFilterSectionUI.jsx'),
  'utf8'
);
const tooljetDbSortSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/RenderSortUI.jsx'),
  'utf8'
);
const tooljetDbCreateRowsSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/CreateRow.jsx'),
  'utf8'
);
const tooljetDbUpdateRowsSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/UpdateRows.jsx'),
  'utf8'
);
const tooljetDbDeleteRowsSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/DeleteRows.jsx'),
  'utf8'
);
const tooljetDbColumnSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/RenderColumnUI.jsx'),
  'utf8'
);
const tooljetDbJoinConstraintSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/JoinConstraint.jsx'),
  'utf8'
);
const tooljetDbJoinSelectSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/JoinSelect.jsx'),
  'utf8'
);
const tooljetDbJoinSortSource = fs.readFileSync(
  path.resolve(__dirname, '../QueryManager/QueryEditors/TooljetDatabase/JoinSort.jsx'),
  'utf8'
);

describe('AB-PANEL-001 app builder panel composition', () => {
  // Break this catches: a migrated surface is accidentally restored to the old right or bottom navigation.
  it('keeps build navigation on the left and runtime diagnostics in the bottom drawer', () => {
    expect(RUNTIME_PANEL_ITEMS.map(({ id }) => id)).toEqual(['inspect', 'debugger']);
    expect(RUNTIME_PANEL_COLLAPSED_HEIGHT).toBe(38);
    expect(EDITOR_CANVAS_WIDTH).toBe('calc(100% - 54px)');
  });

  // Break this catches: the zero-height legacy query pane leaves its top border visible below the runtime bar.
  it('fully removes the runtime content surface when the drawer is collapsed', () => {
    expect(getRuntimePanelContentStyle(false, 70)).toEqual({
      bottom: 38,
      height: 0,
      borderTopWidth: 0,
    });
  });

  // Break this catches: opening Inspector or Debugger covers the tab bar, so the user can't switch tabs.
  it('stacks open drawer content above the tab bar instead of over it', () => {
    expect(getRuntimePanelContentStyle(true, 70)).toEqual({
      bottom: 38,
      height: 'calc(100% - 70% - 38px)',
      borderTopWidth: 1,
    });
  });

  // Break this catches (LP-20): the closed runtime bar covers the canvas bottom, hiding the page-nav toggle.
  it('reserves the closed runtime bar, or the whole open drawer', () => {
    expect(getCanvasReservedBottom(0, false)).toBe(38);
    expect(getCanvasReservedBottom(240, false)).toBe(240);
  });

  // Break this catches (PL-80): the mobile toolbar sits at the canvas bottom, under the runtime bar.
  it('on mobile reserves the runtime bar so the canvas toolbar stays above it', () => {
    expect(getCanvasReservedBottom(0, true)).toBe(38);
    expect(getCanvasReservedBottom(240, true)).toBe(38);
  });

  // Break this catches (PL-35): a closed drawer keeps a reserve, or an open one reserves less than the
  // content plus the tab bar under it, leaving a dead strip between the canvas and the drawer.
  it('reserves the drawer from its top edge to the viewport bottom, and nothing when closed', () => {
    expect(getRuntimePanelCommittedHeight(false, 70, 900)).toBe(0);
    expect(getRuntimePanelCommittedHeight(true, 70, 900)).toBe(270);
    expect(getRuntimePanelCommittedHeight(true, 45, 900)).toBe(495);
    expect(getRuntimePanelCommittedHeight(true, 92, 900)).toBe(72);
  });

  // Break this catches (LR-23): a page popup measured from its row or button, which ends inside the Pages
  // panel, opens over the panel instead of past it.
  it('starts a page popup 8px past the Pages panel edge, whatever it opens from', () => {
    expect(getPastPanelOffset(404)({ reference: { x: 64, width: 279 } })).toEqual([0, 69]);
    expect(getPastPanelOffset(404)({ reference: { x: 54, width: 342 } })).toEqual([0, 16]);
  });

  // Break this catches: at 683px (1024px at 150% zoom) a 304px popup can't fit past a 403px panel and
  // runs 33px off screen; it clamps 8px inside the viewport, over the panel's edge, instead.
  it('clamps a page popup 8px inside the viewport when it cannot fit past the Pages panel', () => {
    const rects = { reference: { x: 64, width: 279 }, popper: { width: 304 } };
    expect(getPastPanelOffset(403, 683)(rects)).toEqual([0, 683 - 8 - 304 - 64 - 279]);
    expect(getPastPanelOffset(404, 1440)(rects)).toEqual([0, 69]);
  });

  // Break this catches: either side panel snaps shut or the bottom drawer uses a different motion curve.
  it('shares the prototype motion timing across left and bottom panels', () => {
    expect(PANEL_MOTION).toEqual({
      durationMs: 180,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      exitEasing: 'cubic-bezier(0.4, 0, 1, 1)',
      leftOffsetPx: 6,
      rightOffsetPx: 6,
      bottomOffsetPx: 4,
      enterFillMode: 'both',
      exitFillMode: 'forwards',
      contentAnimation: 'open-and-switch',
      shellEnterAnimation: false,
      rightContentAnimation: 'open-and-switch',
      rightShellEnterAnimation: false,
    });
  });

  // Break this catches (RT-40): hard-coded colors that drift from the rest of the editor, fail contrast
  // (the old muted #747d8f was 4.14:1) or ignore dark mode. Theme tokens switch with the theme.
  it('colors the runtime bar with theme tokens, the same in light and dark mode', () => {
    const tokens = {
      panel: 'var(--background-surface-layer-01)',
      text: 'var(--text-default)',
      muted: 'var(--text-placeholder)',
      border: 'var(--border-weak)',
      accent: 'var(--border-accent-strong)',
    };
    expect(getRuntimePanelTheme(false)).toEqual(tokens);
    expect(getRuntimePanelTheme(true)).toEqual(tokens);
  });

  it('shows Libraries only for licensed apps outside the module editor', () => {
    expect(shouldShowLibraries(false, true)).toBe(true);
    expect(shouldShowLibraries(false, false)).toBe(false);
    expect(shouldShowLibraries(true, true)).toBe(false);
  });

  // Break this catches: selecting a query opens the old bottom query editor instead of right-side configuration.
  it('routes selected entities to their existing configuration surfaces on the right', () => {
    expect(getRightPanelForSelection('component')).toBe('configuration');
    expect(getRightPanelForSelection('query')).toBe('query');
    expect(getRightPanelForSelection('page')).toBe('page-configuration');
  });

  // Break this catches: Pages and menu escapes Properties and becomes a peer of the top-level tabs.
  it('keeps Pages and menu nested inside the top-level Properties tab', () => {
    expect(getPageSettingsSections('navigation')).toEqual([
      { id: 'properties', sections: ['page-list', 'page-settings'] },
      { id: 'styles', sections: ['page-styles'] },
    ]);
  });

  it('does not add a redundant scrollbar to the Pages panel', () => {
    expect(getLeftPanelOverflow('pages')).toBe('hidden');
    expect(getLeftPanelOverflow('dependencies')).toBe('auto');
  });

  // The chat scrolls its own messages and pins its input to the bottom, so the panel must not scroll too.
  it('does not scroll the AI chat panel around its own message list', () => {
    expect(getLeftPanelOverflow('tooljetai')).toBe('hidden');
  });

  it('treats the AI chat as an ordinary left panel', () => {
    expect(getLeftPanelState('tooljetai', true)).toEqual({ isLeftPanelOpen: true, shouldMountLeftPanel: true });
    expect(getLeftPanelState('pages', true)).toEqual({ isLeftPanelOpen: true, shouldMountLeftPanel: true });
  });

  it('keeps the left panel mounted while it closes, then unmounts it once the selection clears', () => {
    expect(getLeftPanelState('pages', false)).toEqual({ isLeftPanelOpen: false, shouldMountLeftPanel: true });
    expect(getLeftPanelState(null, false)).toEqual({ isLeftPanelOpen: false, shouldMountLeftPanel: false });
  });

  // Break this catches: component tiles lose their compact styling when rendered outside the old right sidebar.
  it('marks the left component picker with its context-independent tile surface', () => {
    expect(getComponentPickerClassName('left')).toBe('components-container components-container--left');
    expect(getComponentPickerClassName('right')).toBe('components-container');
  });

  // Break this catches: the query list loses its row/header layout outside the old bottom query pane.
  it('marks the left query list with its context-independent surface', () => {
    expect(getQueryListClassName('left')).toBe('data-pane query-data-pane--left');
    expect(getQueryListClassName('bottom')).toBe('data-pane');
  });

  // Break this catches: the left query panel falls back to the cramped bottom-pane toolbar.
  it('keeps search visible in the left query panel without changing the bottom query manager', () => {
    expect(getQueryPanelHeaderClassName('left')).toBe('queries-panel-header');
    expect(getQueryPanelHeaderClassName('bottom')).toBe('d-none');
    expect(isQuerySearchPersistent('left')).toBe(true);
    expect(isQuerySearchPersistent('bottom')).toBe(false);
    expect(getQueryToolbarClassName('left', false)).toBe('queries-header queries-toolbar');
    expect(getQueryToolbarClassName('left', true)).toBe('queries-header queries-toolbar');
    expect(getQueryToolbarClassName('bottom', false)).toBe('queries-header');
  });

  // Break this catches: persistent search is appended as a third header row above the query list.
  it('keeps the left query header to two tiers', () => {
    expect(getQueryHeaderPlacement('left')).toEqual({ add: 'title', search: 'toolbar' });
    expect(getQueryHeaderPlacement('bottom')).toEqual({ add: 'toolbar', search: 'conditional' });
  });

  // Break this catches: New query falls back to the smaller control or inherits the shared 500-weight label.
  it('matches the left New query CTA to the top-header Preview button', () => {
    expect(getQueryAddButtonPresentation('left')).toEqual({
      size: 'default',
      style: { fontWeight: 500, padding: '7px 12px' },
      variant: 'outline',
    });
    expect(getQueryAddButtonPresentation('bottom')).toEqual({ size: 'medium', variant: 'outline' });
  });

  // Break this catches: either query popover mounts abruptly without the shared enter/exit transition.
  it('uses one restrained motion contract for New query and filter popovers', () => {
    expect(getQueryPopoverMotion('new-query')).toEqual({
      className: 'query-panel-popover-motion',
      transition: true,
    });
    expect(getQueryPopoverMotion('filter')).toEqual({
      className: 'query-panel-popover-motion',
      transition: true,
    });
    expect(QUERY_POPOVER_MOTION_TARGETS).toEqual(['new-query', 'filter', 'query-actions', 'dropdown', 'parameter']);
    expect(getQueryPopoverMotion('dropdown')).toEqual({
      className: 'query-panel-popover-motion',
      transition: true,
    });
    expect(getQueryPopoverMotion('parameter')).toEqual({
      className: 'query-panel-popover-motion',
      transition: true,
    });
    expect(getQueryPopoverMotion('query-actions')).toEqual({
      className: 'query-panel-popover-motion',
      transition: true,
    });
  });

  // Break this catches: the focused query search loses its complete focus ring outside the old bottom pane.
  it('marks the left query search with its context-independent focus surface', () => {
    expect(getQuerySearchClassName('left', false)).toBe('queries-search d-flex query-search--left');
    expect(getQuerySearchClassName('left', true)).toBe('queries-search d-flex theme-dark query-search--left');
    expect(getQuerySearchClassName('bottom', false)).toBe('queries-search d-flex');
  });

  // Break this catches: focusing the compact left search adds a strong blue fill. Its ring is the
  // editor's one focus ring (Shared/Panel/panel.scss), not a halo of its own.
  it('uses a quiet border focus treatment for left query search', () => {
    expect(getQuerySearchFocusStyle('left')).toEqual({
      '--query-search-focus-background': 'var(--background-surface-layer-01)',
      '--query-search-focus-border': 'var(--border-accent-strong)',
    });
    expect(getQuerySearchFocusStyle('bottom')).toBeUndefined();
  });

  // Break this catches: the wide query editor is squeezed into the 300px component-properties shell.
  it('gives only query configuration the workflow-style wide right surface', () => {
    expect(getRightPanelClassName('query')).toContain('right-panel-shell--query');
    expect(getRightPanelClassName('configuration')).not.toContain('right-panel-shell--query');
    expect(getQueryManagerClassName('right', false)).toBe('query-manager query-manager--right');
    expect(getQueryManagerClassName('bottom', true)).toBe('query-manager theme-dark');
    expect(getRightPanelStyle('query')).toEqual({
      '--query-right-panel-width': 'min(496px, calc(100vw - 54px))',
      maxWidth: 'calc(100vw - 54px)',
      overflow: 'hidden',
      width: 'min(496px, calc(100vw - 54px))',
    });
    expect(getRightPanelStyle('configuration')).toEqual({ overflow: 'auto' });
  });

  // Break this catches: clicking the open tab again does nothing, so the drawer can't be closed from its tab.
  it('closes the drawer when its active tab is clicked again, and opens or switches otherwise', () => {
    expect(getRuntimeTabClickAction('debugger', 'debugger', true)).toBe('close');
    expect(getRuntimeTabClickAction('inspect', 'debugger', true)).toBe('switch');
    expect(getRuntimeTabClickAction('debugger', 'debugger', false)).toBe('open');
    expect(getRuntimeTabClickAction('inspect', 'debugger', false)).toBe('open');
  });

  // Break this catches: the bottom runtime panel slides under the wide query sidebar and clips its right edge.
  it('reserves the right sidebar width under the runtime panel, including the wide query surface', () => {
    expect(getRuntimePanelRightOffset(false, 'query')).toBe(0);
    expect(getRuntimePanelRightOffset(true, 'configuration')).toBe('300px');
    expect(getRuntimePanelRightOffset(true, 'query')).toBe('min(496px, calc(100vw - 54px))');
  });

  it('stops the runtime panel at the docked Code panel, including when the query editor is open', () => {
    expect(getRuntimePanelRightOffset(false, null, null, 650)).toBe('max(0px, calc(100vw - 650px))');
    expect(getRuntimePanelRightOffset(true, 'query', 720, 350)).toBe(
      'max(min(720px, calc(100vw - 54px)), calc(100vw - 350px))'
    );
    expect(getRuntimePanelRightOffset(true, 'query', 496, -116)).toBe(
      'max(min(496px, calc(100vw - 54px)), calc(100vw - 280px))'
    );
  });

  // Break this catches: the canvas reserves 300px while the wider query editor covers its right edge.
  it('reserves the real width of the open right panel on the canvas', () => {
    expect(getRightPanelReservedWidth(false, 'query')).toBe(0);
    expect(getRightPanelReservedWidth(true, 'configuration')).toBe('300px');
    expect(getRightPanelReservedWidth(true, 'query')).toBe('min(496px, calc(100vw - 54px))');
  });

  describe('resizable query panel width', () => {
    // Break this catches: the drag shrinks the panel below its default, or pushes it over the left rail.
    it('keeps a dragged width between the default width and the left rail', () => {
      expect(QUERY_PANEL_RESIZE).toMatchObject({ defaultPx: 496, railPx: 54 });
      expect(clampQueryPanelWidth(300, 1440)).toBe(496);
      expect(clampQueryPanelWidth(800, 1440)).toBe(800);
      expect(clampQueryPanelWidth(1600, 1440)).toBe(1386);
      expect(clampQueryPanelWidth(640.6, 1440)).toBe(641);
      // A window narrower than the default leaves no room: the panel spans to the rail.
      expect(clampQueryPanelWidth(300, 500)).toBe(446);
      expect(clampQueryPanelWidth(900, 500)).toBe(446);
    });

    // Break this catches: with a left panel open, the drag carries the query panel under it.
    it('stops a drag at the open left panel, never below the default width', () => {
      expect(clampQueryPanelWidth(1600, 1440, 350)).toBe(1036);
      expect(clampQueryPanelWidth(800, 1440, 350)).toBe(800);
      expect(clampQueryPanelWidth(300, 1440, 350)).toBe(496);
      // Too narrow for both: the panel keeps its default width and the left panel covers its edge.
      expect(clampQueryPanelWidth(900, 800, 350)).toBe(496);
    });

    // Break this catches: a wide query panel covers an open left panel.
    it('drops the right panel below an open left panel', () => {
      expect(getRightPanelClassName('query', true)).toContain('right-panel-shell--below-left-panel');
      expect(getRightPanelClassName('configuration', true)).toContain('right-panel-shell--below-left-panel');
      expect(getRightPanelClassName('query', false)).not.toContain('right-panel-shell--below-left-panel');
    });

    // Break this catches: a width chosen in a wide window overflows the rail after the window shrinks.
    it('renders a chosen width capped at the rail, and the default width when none is chosen', () => {
      expect(getQueryPanelWidth(null)).toBe('min(496px, calc(100vw - 54px))');
      expect(getQueryPanelWidth(720)).toBe('min(720px, calc(100vw - 54px))');
    });

    // Break this catches: the canvas border and the bottom runtime bar keep the default width after a drag.
    it('reserves the dragged width for the canvas and the runtime panel', () => {
      expect(getRightPanelReservedWidth(true, 'query', 720)).toBe('min(720px, calc(100vw - 54px))');
      expect(getRuntimePanelRightOffset(true, 'query', 720)).toBe('min(720px, calc(100vw - 54px))');
      expect(getRightPanelReservedWidth(true, 'configuration', 720)).toBe('300px');
      expect(getRightPanelReservedWidth(false, 'query', 720)).toBe(0);
      expect(getRightPanelStyle('query', 720)).toMatchObject({
        '--query-right-panel-width': 'min(720px, calc(100vw - 54px))',
        width: 'min(720px, calc(100vw - 54px))',
      });
      expect(getRightPanelStyle('configuration', 720)).toEqual({ overflow: 'auto' });
    });

    // Break this catches: a corrupt saved value (text, zero, negative) renders a 0px or NaN-wide panel.
    it('reads only a positive saved width back after a reload', () => {
      expect(parseStoredQueryPanelWidth('720')).toBe(720);
      expect(parseStoredQueryPanelWidth(null)).toBeNull();
      expect(parseStoredQueryPanelWidth('abc')).toBeNull();
      expect(parseStoredQueryPanelWidth('0')).toBeNull();
      expect(parseStoredQueryPanelWidth('-40')).toBeNull();
    });
  });

  it('widens the canvas by every reserved side width so its content keeps its size', () => {
    expect(getCanvasMinWidth(0, 0)).toBe('');
    expect(getCanvasMinWidth(350, 0)).toBe('calc(100% + 350px)');
    expect(getCanvasMinWidth(0, '300px')).toBe('calc(100% + 300px)');
    expect(getCanvasMinWidth(440, getRightPanelReservedWidth(true, 'query'))).toBe(
      'calc(100% + 440px + min(496px, calc(100vw - 54px)))'
    );
  });

  // Break this catches: right-side query fields return to the legacy horizontal label/control layout.
  it('marks only the right query editor for stacked field composition', () => {
    expect(getQueryDetailsClassName('right', 1)).toBe(
      'query-details query-details--right query-fields-stacked query-details-category--setup'
    );
    expect(getQueryDetailsClassName('right', 2)).toBe(
      'query-details query-details--right query-fields-stacked query-details-category--transformation'
    );
    expect(getQueryDetailsClassName('right', 3)).toBe(
      'query-details query-details--right query-fields-stacked query-details-category--settings'
    );
    expect(getQueryDetailsClassName('bottom')).toBe('query-details');
  });

  // RunJS and RunPython are one code box: the panel never scrolls, only the code inside the box does.
  it('lays out only the RunJS and RunPython setup tab as a code box', () => {
    expect(isCodeQueryLayout('right', 1, 'runjs')).toBe(true);
    expect(isCodeQueryLayout('right', 1, 'runpy')).toBe(true);
    expect(isCodeQueryLayout('right', 3, 'runjs')).toBe(false);
    expect(isCodeQueryLayout('right', 1, 'restapi')).toBe(false);
    expect(isCodeQueryLayout('bottom', 1, 'runjs')).toBe(false);
    expect(getQueryDetailsClassName('right', 1, 'runpy')).toBe(
      'query-details query-details--right query-fields-stacked query-details-category--setup query-details--code'
    );
    expect(getQueryDetailsClassName('right', 3, 'runpy')).toBe(
      'query-details query-details--right query-fields-stacked query-details-category--settings'
    );
  });

  it('scrolls a code query inside its code box instead of the panel', () => {
    const block = queryManagerStyles.slice(queryManagerStyles.indexOf('.query-details--code {'));
    const codeBlock = block.slice(0, block.indexOf('\n  }\n') + 4);

    expect(codeBlock).toMatch(/display: flex;\s*flex-direction: column;\s*overflow: hidden !important;/);
    expect(codeBlock).toMatch(/\.cm-editor \{[^}]*height: 100% !important;[^}]*max-height: 100% !important;/);
    expect(codeBlock).toMatch(/\.cm-scroller \{[^}]*overflow: auto;/);
  });

  // Break this catches: ToolJet Database Aggregate and Group by retain their legacy horizontal wrapper,
  // pushing their controls beyond the right-side query editor.
  it('stacks ToolJet Database aggregate wrappers only inside the right query field surface', () => {
    expect(queryManagerStyles).toMatch(
      /\.query-fields-stacked\s*\{[\s\S]*?\.wf-block[\s\S]*?flex-direction:\s*column\s*!important;/
    );
    expect(queryManagerStyles).toMatch(
      /\.query-fields-stacked\s*\{[\s\S]*?\.wf-block\s*>\s*:not\(\.form-label\)[\s\S]*?width:\s*100%\s*!important;/
    );
  });

  // Break this catches: the Join tables From controls keep a nested horizontal wrapper and render
  // beyond the right-side query editor even though the outer dynamic form row is stacked.
  it('marks the ToolJet Database join source as a stacked right-query field group', () => {
    expect(tooljetDbJoinTableSource).toMatch(
      /\{\/\* Join Section \*\/\}[\s\S]*?className="field-container tooljetdb-worflow-operations d-flex"[\s\S]*?>From<\//
    );
  });

  // Break this catches: ToolJet Database list-row controls drift to mixed heights, radii, borders,
  // and section spacing after the shared right-query dropdown height changes.
  it('marks ToolJet Database list rows for one coherent compound-field layout', () => {
    expect(tooljetDbListRowsSource).toContain('className="tooljetdb-operation-form tooljetdb-list-rows"');
    expect(tooljetDbFilterSource).toContain('className="mb-2 mx-0 tooljetdb-condition-row"');
    expect(tooljetDbSortSource).toContain('className="mb-2 mx-0 tooljetdb-condition-row"');
    expect(queryManagerStyles).toMatch(
      /\.query-fields-stacked\s*\{[\s\S]*?\.tooljetdb-operation-form\s*\{[\s\S]*?--tjdb-compound-control-height:\s*var\(--query-dropdown-height\)/
    );
    expect(queryManagerStyles).toMatch(
      /\.tooljetdb-condition-row[\s\S]*?border-radius:\s*8px 0 0 8px\s*!important;[\s\S]*?\.qm-delete-btn[\s\S]*?border-radius:\s*0 8px 8px 0\s*!important;/
    );
  });

  // Break this catches: Create, Update, Delete, or Join operations bypass the shared TJDB control
  // shell and reintroduce 30/31px controls or mismatched compound-row corners.
  it('uses the same compound-field contract for every ToolJet Database GUI operation', () => {
    expect(tooljetDbListRowsSource).toContain('tooljetdb-operation-form tooljetdb-list-rows');
    expect(tooljetDbCreateRowsSource).toContain('tooljetdb-operation-form');
    expect(tooljetDbUpdateRowsSource).toContain('tooljetdb-operation-form');
    expect(tooljetDbDeleteRowsSource).toContain('tooljetdb-operation-form');
    expect(tooljetDbJoinTableSource).toContain('tooljetdb-operation-form tooljetdb-join-table');
    expect(tooljetDbColumnSource).toContain('tooljetdb-condition-row');
    expect(tooljetDbJoinConstraintSource).toContain('tooljetdb-condition-row tooljetdb-join-row');
  });

  it('keeps ToolJet Database join filters, sorting, and selected columns inside the shared row geometry', () => {
    expect(tooljetDbJoinTableSource).toContain('tooljetdb-condition-row');
    expect(tooljetDbJoinSortSource).toContain('tooljetdb-condition-row');
    expect(tooljetDbJoinSelectSource).toContain('tooljetdb-condition-row');
    expect(queryManagerStyles).toMatch(
      /\.tooljetdb-operation-form\s*\{[\s\S]*?\.tjdb-codhinter-wrapper\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?\.qm-delete-btn\s*\{[\s\S]*?flex:\s*0 0 30px\s*!important;/
    );
  });

  // Break this catches: query field labels drift to mixed colors, sizes, or weights across editor types.
  it('uses one visual token contract for right-side query field labels', () => {
    expect(QUERY_FIELD_LABEL_CLASS_NAME).toBe('query-field-label');
    expect(QUERY_FIELD_HELPER_CLASS_NAME).toBe('query-field-helper');
    expect(getQueryTypographyClassName('label')).toBe('query-field-label');
    expect(getQueryTypographyClassName('helper')).toBe('query-field-helper');
    expect(getQueryDetailsStyle('right')).toEqual({
      '--query-panel-background': 'var(--background-surface-layer-01)',
      '--query-field-label-color': 'var(--slate11)',
      '--query-field-label-font-size': '13px',
      '--query-field-label-font-weight': 400,
      '--query-field-label-line-height': '20px',
      '--query-field-helper-color': 'var(--slate10)',
      '--query-field-helper-font-size': '11px',
      '--query-field-helper-font-weight': 400,
      '--query-field-helper-line-height': '16px',
      '--query-field-value-color': 'var(--text-default)',
      '--query-field-value-font-size': '13px',
      '--query-field-value-font-weight': 400,
      '--query-field-value-line-height': '20px',
      '--query-control-background': 'var(--background-surface-layer-01)',
      '--query-control-border': 'var(--slate7)',
      '--query-control-border-width': '1px',
      '--query-dropdown-button-border-width': '0px',
      '--query-dropdown-height': '32px',
      '--query-dropdown-hover-background': 'var(--background-surface-layer-01)',
      '--query-dropdown-focus-border': 'var(--border-accent-strong)',
      '--query-dropdown-focus-shadow': 'inset 0 0 0 1px var(--border-accent-strong)',
      '--query-dropdown-selected-background': 'var(--background-surface-layer-01)',
    });
    expect(getQueryDetailsStyle('bottom')).toBeUndefined();
  });

  it('uses the input accent border and inset focus indicator without changing control geometry', () => {
    const style = getQueryDetailsStyle('right');

    expect(style['--query-control-background']).toBe('var(--background-surface-layer-01)');
    expect(style['--query-control-border']).toBe('var(--slate7)');
    expect(style['--query-control-border-width']).toBe('1px');
    expect(style['--query-dropdown-button-border-width']).toBe('0px');
    expect(style['--query-dropdown-hover-background']).toBe('var(--background-surface-layer-01)');
    expect(style['--query-dropdown-focus-border']).toBe('var(--border-accent-strong)');
    expect(style['--query-dropdown-focus-shadow']).toBe('inset 0 0 0 1px var(--border-accent-strong)');
    expect(style['--query-dropdown-selected-background']).toBe('var(--background-surface-layer-01)');
  });

  // Break this catches: React Select's zero-width search input inherits the field border and
  // leaves a tiny stray mark before the selected dropdown value.
  it('keeps the internal dropdown search input visually transparent', () => {
    expect(queryManagerStyles).toMatch(
      /input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\):not\(\[role='combobox'\]\)/
    );
    expect(queryManagerStyles).toMatch(
      /input\[role='combobox'\]\s*\{[\s\S]*?border:\s*0\s*!important;[\s\S]*?background:\s*transparent\s*!important;/
    );
  });

  // Break this catches: CodeHinter text outside queries falls back to a platform-dependent generic monospace face.
  it('uses Source Code Pro for code-like inputs throughout App Builder', () => {
    expect(getAppBuilderTypographyVariables()).toEqual({
      '--app-builder-font-family': "'IBM Plex Sans', sans-serif",
      '--app-builder-code-font-family': "'Source Code Pro', monospace",
      '--app-builder-canvas-font-family': "'IBM Plex Sans'",
      '--app-builder-small-font-size': '12px',
    });
  });

  // Break this catches: the last PostgreSQL fields slide underneath Preview before the body can scroll.
  it('reserves the preview height inside the right query scroll surface', () => {
    // UC-05: the right panel's scroll area must end where the docked preview starts, not run under it.
    expect(getQueryDetailsOverflowStyle('right', true, 40)).toEqual({ marginBottom: '40px' });
    expect(getQueryDetailsOverflowStyle('bottom', true, 40)).toEqual({
      height: 'calc(100% - 80px)',
    });
    expect(getQueryDetailsOverflowStyle('right', false, 40)).toEqual({
      height: 'calc(100% - 0px)',
    });
  });

  it('uses the animated PostgreSQL-style dropdown for ToolJet Database mode selection', () => {
    expect(TOOLJET_DB_MODE_OPTIONS).toEqual([
      { label: 'GUI mode', value: 'GUI mode' },
      { label: 'SQL mode', value: 'SQL mode' },
    ]);
    expect(getTooljetDbModeControlPresentation()).toEqual({
      animateMenu: true,
      height: 36,
      type: 'dropdown',
      useMenuPortal: false,
    });
    expect(getTooljetDbModeControlPresentation('right').height).toBe(32);
  });

  // Break this catches: the preview opens over the query fields under the 48px header and 36px tabs.
  it('reserves the query header, its tab strip and one row of fields above the preview', () => {
    expect(PREVIEW_PANEL.reservedAbovePx).toBe(QUERY_HEADER_PX + QUERY_TABS_PX + 40);
    expect([QUERY_HEADER_PX, QUERY_TABS_PX]).toEqual([48, 36]);
  });

  // Break this catches: the query close button names itself apart from the registry.
  it('names right panel close buttons from the registry', () => {
    expect(getPanelCloseLabel('query')).toBe('Close query configuration');
    expect(getPanelCloseLabel('component')).toBe('Close component configuration');
    expect(getPanelCloseLabel('page')).toBe('Close page configuration');
  });

  // Break this catches: a stale expanded drawer measurement leaves a dead strip below the left panel.
  it('reserves only the visible runtime surface below the left panel', () => {
    expect(getLeftPanelReservedBottom(false, 224)).toBe(38);
    expect(getLeftPanelReservedBottom(true, 224)).toBe(224);
    expect(getLeftPanelReservedBottom(true, 0)).toBe(38);
  });

  it('uses an exact viewport calculation instead of a fractional vh conversion', () => {
    expect(getLeftPanelHeight(false, 224)).toBe('calc(100vh - 86px)');
    expect(getLeftPanelHeight(true, 224)).toBe('calc(100vh - 272px)');
  });
});

describe('AB-PANEL-NAMES panel and drawer names', () => {
  // Break this catches: renaming a panel moves the data-cy hook that Cypress specs click.
  it('keeps every rail data-cy hook frozen', () => {
    expect(Object.fromEntries(Object.entries(SIDEBAR_ITEMS).map(([panel, { cy }]) => [panel, cy]))).toEqual({
      tooljetai: 'ai-agent',
      pages: 'pages',
      components: 'components',
      queries: 'queries',
      variables: 'variables',
      libraries: 'libraries',
      search: 'code-search',
      dependencies: 'dependencies',
      apphistory: 'app-history',
      security: 'security',
      access: 'access',
      settings: 'settings',
    });
  });

  it('closes a panel by its name, keeping acronyms', () => {
    expect(getPanelCloseLabel('settings')).toBe('Close app settings');
    expect(getPanelCloseLabel('tooljetai')).toBe('Close AI chat');
  });

  // UC-23: the drawer is called Inspector or Debugger at every entry point.
  it('names the drawer after its tab, and each search box after what it searches', () => {
    expect(getRuntimeToggleLabel(true, 'inspect')).toBe('Close inspector');
    expect(getRuntimeToggleLabel(false, 'debugger')).toBe('Open debugger');
    expect(getRuntimeSearchName('inspect')).toBe('Search inspector');
    expect(getRuntimeSearchName('debugger')).toBe('Search logs');
  });
});
