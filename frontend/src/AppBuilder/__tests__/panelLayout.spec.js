import {
  LEFT_PANEL_SECTIONS,
  PANEL_MOTION,
  EDITOR_CANVAS_WIDTH,
  RUNTIME_PANEL_COLLAPSED_HEIGHT,
  RUNTIME_PANEL_ITEMS,
  getRuntimePanelContentStyle,
  getCanvasReservedBottom,
  getRuntimePanelMeasuredHeight,
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
  getRuntimeTabClickAction,
  getQueryHeaderClassName,
  getQueryHeaderControlPresentation,
  getQueryDetailsClassName,
  getQueryDetailsStyle,
  getAppBuilderTypographyStyle,
  getQueryDetailsOverflowStyle,
  QUERY_FIELD_LABEL_CLASS_NAME,
  QUERY_FIELD_HELPER_CLASS_NAME,
  getQueryTypographyClassName,
  getQueryTabClassName,
  getQueryTabsStyle,
  getLeftPanelReservedBottom,
  getLeftPanelHeight,
  shouldShowLibraries,
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
    expect(LEFT_PANEL_SECTIONS).toEqual([
      {
        id: 'build',
        items: [
          { id: 'pages', label: 'Pages', icon: 'files' },
          { id: 'components', label: 'Components', icon: 'blocks' },
          { id: 'queries', label: 'Queries', icon: 'database-zap' },
          { id: 'libraries', label: 'Libraries', icon: 'box' },
        ],
      },
      {
        id: 'manage',
        items: [
          { id: 'dependencies', label: 'Dependencies', icon: 'network' },
          { id: 'apphistory', label: 'App history', icon: 'history' },
          { id: 'settings', label: 'Settings', icon: 'settings' },
        ],
      },
    ]);
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
      borderTopWidth: 2,
    });
  });

  // Break this catches: the closed runtime bar reserves a blank strip instead of overlaying the canvas.
  it('reserves canvas height only for open drawer content', () => {
    expect(getCanvasReservedBottom(0, false)).toBe(0);
    expect(getCanvasReservedBottom(240, false)).toBe(240);
    expect(getCanvasReservedBottom(240, true)).toBe(0);
  });

  // Break this catches: closing the drawer stores an in-flight expanded height and restores the blank canvas gap.
  it('never measures transitional content height for a collapsed drawer', () => {
    expect(getRuntimePanelMeasuredHeight(false, 222)).toBe(0);
    // Open content sits on the tab bar, so the reserved height includes the bar.
    expect(getRuntimePanelMeasuredHeight(true, 222)).toBe(260);
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

  // Break this catches: global theme tokens make the bottom bar drift from the approved prototype palette.
  it('uses the exact prototype colors for selected and unselected runtime tabs', () => {
    expect(getRuntimePanelTheme(false)).toEqual({
      panel: '#ffffff',
      text: '#222631',
      muted: '#747d8f',
      border: '#e1e5ed',
      accent: '#4368e8',
    });
    expect(getRuntimePanelTheme(true)).toEqual({
      panel: '#1e232d',
      text: '#f3f5f9',
      muted: '#a8b0bf',
      border: '#353c49',
      accent: '#7895ff',
    });
  });

  // Break this catches: generic or mismatched glyphs replace the approved Lucide rail icons.
  it('uses the selected-anchor prototype icon set for every implemented rail destination', () => {
    const railIcons = LEFT_PANEL_SECTIONS.flatMap(({ items }) => items).map(({ id, icon }) => [id, icon]);

    expect(railIcons).toEqual([
      ['pages', 'files'],
      ['components', 'blocks'],
      ['queries', 'database-zap'],
      ['libraries', 'box'],
      ['dependencies', 'network'],
      ['apphistory', 'history'],
      ['settings', 'settings'],
    ]);
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
      style: { fontWeight: 400, padding: '7px 12px' },
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

  // Break this catches: focusing the compact left search adds a strong blue fill or halo.
  it('uses a quiet border-only focus treatment for left query search', () => {
    expect(getQuerySearchFocusStyle('left')).toEqual({
      '--query-search-focus-background': 'var(--background-surface-layer-01)',
      '--query-search-focus-border': 'var(--slate8)',
      '--query-search-focus-shadow': 'none',
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
      /\.tooljetdb-condition-row[\s\S]*?border-radius:\s*6px 0 0 6px\s*!important;[\s\S]*?\.qm-delete-btn[\s\S]*?border-radius:\s*0 6px 6px 0\s*!important;/
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
      '--query-panel-background': '#ffffff',
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
      '--query-control-background': '#ffffff',
      '--query-control-border': 'var(--slate7)',
      '--query-control-border-width': '1px',
      '--query-dropdown-button-border-width': '0px',
      '--query-dropdown-height': '36px',
      '--query-dropdown-hover-background': '#ffffff',
      '--query-dropdown-focus-border': 'var(--slate7)',
      '--query-dropdown-focus-shadow': 'none',
      '--query-dropdown-selected-background': '#ffffff',
    });
    expect(getQueryDetailsStyle('bottom')).toBeUndefined();
  });

  // Break this catches: query controls regain hover, focus, or open-state chrome that visually shifts the field.
  it('keeps query inputs visually static while they remain fully interactive', () => {
    const style = getQueryDetailsStyle('right');

    expect(style['--query-control-background']).toBe('#ffffff');
    expect(style['--query-control-border']).toBe('var(--slate7)');
    expect(style['--query-control-border-width']).toBe('1px');
    expect(style['--query-dropdown-button-border-width']).toBe('0px');
    expect(style['--query-dropdown-hover-background']).toBe('#ffffff');
    expect(style['--query-dropdown-focus-border']).toBe('var(--slate7)');
    expect(style['--query-dropdown-focus-shadow']).toBe('none');
    expect(style['--query-dropdown-selected-background']).toBe('#ffffff');
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
    expect(getAppBuilderTypographyStyle()).toEqual({
      '--app-builder-font-family': "'Inter', sans-serif",
      '--app-builder-code-font-family': "'Source Code Pro', monospace",
      '--app-builder-canvas-font-family': "'IBM Plex Sans', sans-serif",
    });
  });

  // Break this catches: the last PostgreSQL fields slide underneath Preview before the body can scroll.
  it('reserves the preview height inside the right query scroll surface', () => {
    expect(getQueryDetailsOverflowStyle('right', true, 40)).toEqual({
      height: 'calc(100% - 80px)',
      paddingBottom: '56px',
    });
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
  });

  // Break this catches: Run and Preview fall back into normal flow and float between the query tabs and form.
  it('anchors right-side query actions in the compact header grid', () => {
    expect(getQueryHeaderClassName('right')).toBe(
      'row header query-manager-header--right query-manager-header--polished'
    );
    expect(getQueryHeaderClassName('bottom')).toBe('row header');
    expect(getQueryTabsStyle('right')).toEqual({
      gap: '3px',
      '--query-tab-font-size': '13px',
      '--query-tab-font-weight': 400,
      '--query-tab-line-height': '20px',
    });
    expect(getQueryTabsStyle('bottom')).toEqual({ gap: '3px', marginBottom: '-15px' });
    expect(getQueryTabClassName('right', true)).toBe('query-manager-tab query-manager-tab--right is-active');
    expect(getQueryTabClassName('right', false)).toBe('query-manager-tab query-manager-tab--right');
    expect(getQueryTabClassName('bottom', true)).toBe('query-manager-tab is-active');
  });

  // Break this catches: Run, Preview, and Close drift to different control heights in the query header.
  it('uses one coherent size contract for every query header action', () => {
    const controls = ['run', 'preview', 'close'].map(getQueryHeaderControlPresentation);

    expect(controls.map(({ size }) => size)).toEqual(['medium', 'medium', 'medium']);
    expect(controls.every(({ className }) => className.includes('query-header-control'))).toBe(true);
  });

  // Break this catches: the right-panel Preview label inherits the shared 500-weight button text.
  it('uses regular weight only for Preview in the right query panel', () => {
    expect(getQueryHeaderControlPresentation('preview', 'right').style).toEqual({ fontWeight: 400 });
    expect(getQueryHeaderControlPresentation('preview', 'bottom').style).toBeUndefined();
  });

  // Break this catches: the compact Close glyph inherits the 14px medium icon and looks undersized beside text actions.
  it('gives the query Close action a legible icon without increasing its control height', () => {
    expect(getQueryHeaderControlPresentation('close')).toEqual({
      className: 'query-header-control query-header-control--close',
      iconSizePx: 16,
      size: 'medium',
    });
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
