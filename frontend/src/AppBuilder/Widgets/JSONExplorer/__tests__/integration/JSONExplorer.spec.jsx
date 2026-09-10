import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { jsonExplorerConfig as frontendConfig } from '@/AppBuilder/WidgetManager/widgets/jsonExplorer';
import { jsonExplorerConfig as serverConfig } from '../../../../../../../server/src/modules/apps/services/widget-config/jsonExplorer';

const ID = 'json1';
const DEFAULT_VALUE = {
  text: 'Hello World',
  number: 64,
  boolean: true,
  nullValue: null,
  fruits: ['banana', 'mango', 'grape'],
  objectA: { value: 'testing', enabled: false },
  items: [],
};
const DEFAULT_VALUE_EXPRESSION = `{{${JSON.stringify(DEFAULT_VALUE)}}}`;

const widget = createWidgetHarness({
  componentType: 'JSONExplorer',
  handle: 'jsonexplorer1',
  id: ID,
  widgetHeight: 124,
  offsetHeight: 180,
  defaultProperties: {
    value: binding(DEFAULT_VALUE_EXPRESSION),
    theme: binding('solarized'),
    shouldExpandEntireJSON: binding('{{true}}'),
    shouldShowRootNode: binding('{{true}}'),
    dynamicHeight: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    backgroundColor: binding('rgb(255, 255, 255)'),
    borderColor: binding('rgb(204, 204, 204)'),
    borderRadius: binding('{{6}}'),
    boxShadow: binding('none'),
  },
});

const valueBinding = (value) => binding(`{{${JSON.stringify(value)}}}`);
const explorer = (container) => container.querySelector('.json-explorer');
const tree = (container) => explorer(container)?.querySelector(':scope > ul');
const wrapper = (container) => container.querySelector('[data-cy="draggable-widget-jsonexplorer1"]');
const text = (container) => explorer(container)?.textContent ?? '';
const exactText = (container, expected) =>
  [...explorer(container).querySelectorAll('span')].find((node) => node.textContent === expected);
const label = (container, name) => exactText(container, `${name}:`);
const disclosure = (container, name) => label(container, name).closest('li').firstElementChild;
const tempLayout = () => widget.session.store.read((state) => state.temporaryLayouts[ID]);

async function setProperty(name, value, type = 'properties') {
  await widget.session.store.act(() => widget.setComponentProperty(ID, name, value, type));
}

async function expectVisibleText(container, expected) {
  await waitFor(() => expect(exactText(container, expected)).toBeVisible());
}

async function expectHiddenText(container, expected) {
  await waitFor(() => expect(exactText(container, expected)).toBeUndefined());
}

describe('JSONExplorer widget', () => {
  let offsetParentDescriptor;

  beforeEach(() => {
    offsetParentDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent');
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      configurable: true,
      get() {
        return this.parentElement;
      },
    });
    widget.setup();
  });
  afterEach(() => {
    widget.teardown();
    if (offsetParentDescriptor) Object.defineProperty(HTMLElement.prototype, 'offsetParent', offsetParentDescriptor);
    else delete HTMLElement.prototype.offsetParent;
  });

  test('[JSONExplorer-DAT-001] the default mixed-type object renders as a navigable JSON tree and is exposed unchanged', async () => {
    // Break this catches: replacing the registered mixed-type value with an empty/stale tree, or publishing a different value.
    const { container } = widget.render();

    await expectVisibleText(container, '"Hello World"');
    for (const expected of [
      'text:',
      '64',
      'true',
      'nullValue:',
      '"banana"',
      'objectA:',
      '"testing"',
      'false',
      'items:',
    ]) {
      expect(exactText(container, expected)).toBeVisible();
    }
    expect(tree(container)).toBeInTheDocument();
    expect(widget.exposed().value).toEqual(DEFAULT_VALUE);
  });

  test('[JSONExplorer-DAT-002] arrays, empty containers, false, zero, empty string, and null retain their JSON meaning', async () => {
    // Break this catches: truthiness filtering or object-only handling drops a valid falsy leaf, array root, or empty container.
    const value = [false, 0, '', null, [], {}];
    const { container } = widget.render({ properties: { value: valueBinding(value) } });

    await expectVisibleText(container, 'false');
    for (const expected of ['0', '""', 'null']) {
      expect(exactText(container, expected)).toBeVisible();
    }
    expect(text(container)).toContain('6 items');
    expect(text(container)).toContain('[] 0 items');
    expect(text(container)).toContain('{} 0 keys');
    expect(widget.exposed().value).toEqual(value);
  });

  test('[JSONExplorer-DAT-003] a resolved value-property change replaces the visible and exposed value', async () => {
    // Break this catches: updating only the exposed variable leaves react-json-tree showing stale keys.
    const { container } = widget.render({ properties: { value: valueBinding({ stale: 'old' }) } });
    await expectVisibleText(container, '"old"');

    await setProperty('value', '{{({ fresh: "new" })}}');

    await expectVisibleText(container, '"new"');
    expect(exactText(container, 'stale:')).toBeUndefined();
    expect(widget.exposed().value).toEqual({ fresh: 'new' });
  });

  test('[JSONExplorer-DAT-004] setValue survives unrelated resolution and a no-op value rewrite', async () => {
    // Break this catches: syncing every resolution pass into local state clobbers an imperative value with the binding.
    const imperative = { source: 'action' };
    const { container } = widget.render();

    await widget.act('setValue', imperative);
    await setProperty('theme', 'monokai');
    await setProperty('value', DEFAULT_VALUE_EXPRESSION);

    await expectVisibleText(container, '"action"');
    expect(widget.exposed().value).toEqual(imperative);

    await setProperty('value', '{{({ source: "property" })}}');
    await expectVisibleText(container, '"property"');
    expect(widget.exposed().value).toEqual({ source: 'property' });
  });

  test('[JSONExplorer-DAT-005] invalid bound scalar data resolves to the registered array/object fallback', async () => {
    // Break this catches: bypassing the union schema lets a scalar binding replace the explorer's valid default value.
    const { container } = widget.render({ properties: { value: binding('{{"invalid"}}') } });

    await waitFor(() => expect(text(container)).toContain('[] 0 items'));
    expect(text(container)).not.toContain('invalid');
    expect(widget.exposed().value).toEqual([]);
  });

  test('[JSONExplorer-TRE-001] expand-entire-JSON controls nested disclosure and genuine property changes reapply it', async () => {
    // Break this catches: ignoring shouldExpandEntireJSON or failing to remount leaves nested branches stuck.
    const { container } = widget.render({
      properties: { value: valueBinding({ branch: { leaf: 'deep' } }), shouldExpandEntireJSON: binding('{{true}}') },
    });
    await expectVisibleText(container, '"deep"');

    await setProperty('shouldExpandEntireJSON', '{{false}}');
    await expectHiddenText(container, '"deep"');

    await setProperty('shouldExpandEntireJSON', '{{true}}');
    await expectVisibleText(container, '"deep"');
  });

  test('[JSONExplorer-TRE-002] hiding the synthetic root preserves first-level keys and a property change restores it', async () => {
    // Break this catches: mapping show-root incorrectly can hide the data level or permanently suppress the root row.
    const { container } = widget.render({
      properties: { value: valueBinding({ firstLevel: 'kept' }), shouldShowRootNode: binding('{{false}}') },
    });

    await expectVisibleText(container, '"kept"');
    expect(label(container, 'root')).toBeUndefined();
    expect(label(container, 'firstLevel')).toBeVisible();

    await setProperty('shouldShowRootNode', '{{true}}');
    await waitFor(() => expect(label(container, 'root')).toBeVisible());
    expect(label(container, 'firstLevel')).toBeVisible();
  });

  test('[JSONExplorer-TRE-003] pointer disclosure survives unrelated property resolution', async () => {
    // Break this catches: remounting JSONTree for every property update resets the builder's manual branch choice.
    const { container } = widget.render({ properties: { value: valueBinding({ branch: { leaf: 'deep' } }) } });
    await expectVisibleText(container, '"deep"');

    await widget.session.user.click(disclosure(container, 'branch'));
    await expectHiddenText(container, '"deep"');

    await setProperty('theme', 'monokai');
    expect(exactText(container, '"deep"')).toBeUndefined();

    await widget.session.user.click(disclosure(container, 'branch'));
    await expectVisibleText(container, '"deep"');
  });

  test('[JSONExplorer-THM-001] every registered theme changes the palette without changing data or transparency', async () => {
    // Break this catches: a stale theme mapping or opaque base makes a registered option visually ineffective.
    const palettes = {
      monokai: 'rgb(102, 217, 239)',
      solarized: 'rgb(38, 139, 210)',
      tomorrow: 'rgb(129, 162, 190)',
      bespin: 'rgb(94, 166, 234)',
    };
    const { container } = widget.render({ properties: { value: valueBinding({ marker: 'same-data' }) } });

    expect(frontendConfig.properties.theme.options.map(({ value }) => value)).toEqual(Object.keys(palettes));
    for (const [theme, color] of Object.entries(palettes)) {
      await setProperty('theme', theme);
      await waitFor(() => expect(label(container, 'marker').parentElement).toHaveStyle({ color }));
      expect(exactText(container, '"same-data"')).toBeVisible();
      expect(tree(container)).toHaveStyle({ backgroundColor: 'transparent' });
    }
    expect(widget.exposed().value).toEqual({ marker: 'same-data' });
  });

  test('[JSONExplorer-STA-001] loading property and setLoading gate the tree while preserving action precedence', async () => {
    // Break this catches: resolution overwrites setLoading, or loading leaves both the spinner and data mounted.
    const { container } = widget.render();

    await widget.act('setLoading', 'truthy');
    await setProperty('theme', 'monokai');
    await setProperty('loadingState', '{{false}}');

    expect(explorer(container).querySelector('.tj-widget-loader')).toBeInTheDocument();
    expect(tree(container)).not.toBeInTheDocument();
    expect(widget.exposed().isLoading).toBe(true);

    await setProperty('loadingState', '{{true}}');
    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(tree(container)).toBeInTheDocument());
    expect(widget.exposed().isLoading).toBe(false);

    await widget.act('setLoading', 0);
    expect(widget.exposed().isLoading).toBe(false);
  });

  test('[JSONExplorer-STA-002] visibility hides the explorer without losing data and preserves action precedence', async () => {
    // Break this catches: setVisibility mutates data or a no-op property write restores visibility.
    const { container } = widget.render();

    await widget.act('setVisibility', 0);
    await setProperty('theme', 'monokai');
    await setProperty('visibility', '{{true}}');

    expect(explorer(container)).toHaveStyle({ visibility: 'hidden' });
    expect(widget.exposed()).toMatchObject({ isVisible: false, value: DEFAULT_VALUE });

    await setProperty('visibility', '{{false}}');
    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(explorer(container)).toHaveStyle({ visibility: 'visible' }));
    expect(widget.exposed()).toMatchObject({ isVisible: true, value: DEFAULT_VALUE });
  });

  test('[JSONExplorer-STA-003] disabled state blocks disclosure without altering data and preserves action precedence', async () => {
    // Break this catches: the stale setDisabled callable or missing wrapper class leaves disclosure interactive.
    const { container } = widget.render({ properties: { value: valueBinding({ branch: { leaf: 'deep' } }) } });
    await expectVisibleText(container, '"deep"');

    await widget.act('setDisable', 'truthy');
    await setProperty('theme', 'monokai');
    await setProperty('disabledState', '{{false}}');

    expect(wrapper(container)).toHaveClass('disabled');
    await expect(widget.session.user.click(disclosure(container, 'branch'))).rejects.toThrow(/pointer-events/);
    expect(exactText(container, '"deep"')).toBeVisible();
    expect(widget.exposed()).toMatchObject({ isDisabled: true, value: { branch: { leaf: 'deep' } } });

    await setProperty('disabledState', '{{true}}');
    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(wrapper(container)).not.toHaveClass('disabled'));
    expect(widget.exposed().isDisabled).toBe(false);
  });

  test('[JSONExplorer-STA-004] loading, visibility, and disabled state remain independent', async () => {
    // Break this catches: replacing instead of merging temporary state makes the last action clear another flag.
    const { container } = widget.render();

    await widget.act('setLoading', true);
    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);

    expect(widget.exposed()).toMatchObject({ isLoading: true, isVisible: false, isDisabled: true });
    expect(explorer(container)).toHaveStyle({ visibility: 'hidden' });
    expect(explorer(container).querySelector('.tj-widget-loader')).toBeInTheDocument();
    expect(wrapper(container)).toHaveClass('disabled');

    await widget.act('setLoading', false);
    expect(widget.exposed()).toMatchObject({ isLoading: false, isVisible: false, isDisabled: true });
    expect(tree(container)).toBeInTheDocument();
    expect(explorer(container)).toHaveStyle({ visibility: 'hidden' });
    expect(wrapper(container)).toHaveClass('disabled');
  });

  test('[JSONExplorer-STA-005] setValue while loading is revealed when loading clears', async () => {
    // Break this catches: the loading branch discards an imperative value update instead of retaining it.
    const { container } = widget.render();
    const hiddenUpdate = { revealed: 'after-load' };

    await widget.act('setLoading', true);
    await widget.act('setValue', hiddenUpdate);
    expect(tree(container)).not.toBeInTheDocument();
    expect(widget.exposed().value).toEqual(hiddenUpdate);

    await widget.act('setLoading', false);
    await expectVisibleText(container, '"after-load"');
    expect(widget.exposed().value).toEqual(hiddenUpdate);
  });

  test('[JSONExplorer-DYN-001] dynamic height is view-only and retains the authored minimum height', async () => {
    // Break this catches: edit-mode dynamic height or a missing floor shrinks below the builder's authored box.
    const { container } = widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });

    expect(explorer(container)).toHaveStyle({ height: '120px' });
    expect(explorer(container).style.minHeight).toBe('');

    await widget.session.store.act(() =>
      widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode: 'view' })
    );
    await waitFor(() => expect(explorer(container)).toHaveStyle({ height: '100%', minHeight: '120px' }));
  });

  test('[JSONExplorer-DYN-002] data, expansion policy, and manual disclosure each schedule dynamic reflow', async () => {
    // Break this catches: removing any content-change trigger leaves temporary layout height stale.
    const { container } = widget.render({
      properties: { value: valueBinding({ branch: { leaf: 'deep' } }), dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    const layoutElement = wrapper(container);
    layoutElement.classList.add(`ele-${ID}`);
    layoutElement.dataset.layoutContext = 'root';

    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await setProperty('value', '{{({ branch: { leaf: "changed" }, extra: true })}}');
    await waitFor(() => expect(tempLayout()?.height).toBe(180));

    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await setProperty('shouldExpandEntireJSON', '{{false}}');
    await waitFor(() => expect(tempLayout()?.height).toBe(180));

    await setProperty('shouldExpandEntireJSON', '{{true}}');
    await waitFor(() => expect(label(container, 'branch')).toBeVisible());
    await widget.session.store.act((state) => state.clearTemporaryLayouts());
    await widget.session.user.click(disclosure(container, 'branch'));
    await waitFor(() => expect(tempLayout()?.height).toBe(180));
  });

  test('[JSONExplorer-STY-001] background color is applied to the explorer container', async () => {
    // Break this catches: dropping the background mapping makes the transparent tree reveal the wrong surface.
    const { container } = widget.render({ styles: { backgroundColor: binding('rgb(12, 34, 56)') } });
    await waitFor(() => expect(explorer(container)).toHaveStyle({ backgroundColor: 'rgb(12, 34, 56)' }));
  });

  test('[JSONExplorer-STY-002] border color is applied as a one-pixel solid border', async () => {
    // Break this catches: omitting the border token or its fixed width/style removes the authored boundary.
    const { container } = widget.render({ styles: { borderColor: binding('rgb(21, 43, 65)') } });
    await waitFor(() => expect(explorer(container)).toHaveStyle({ border: '1px solid rgb(21, 43, 65)' }));
  });

  test('[JSONExplorer-STY-003] numeric and string border-radius values resolve to pixels', async () => {
    // Break this catches: handling only one string/number schema arm yields an invalid saved radius.
    const { container } = widget.render({ styles: { borderRadius: binding('{{12}}') } });
    await waitFor(() => expect(explorer(container)).toHaveStyle({ borderRadius: '12px' }));

    await setProperty('borderRadius', '8', 'styles');
    await waitFor(() => expect(explorer(container)).toHaveStyle({ borderRadius: '8px' }));
  });

  test('[JSONExplorer-STY-004] box shadow is applied unchanged to the explorer container', async () => {
    // Break this catches: reading only the universal shadow bucket replaces the widget-owned shadow.
    const shadow = 'rgb(1, 2, 3) 2px 4px 6px 0px';
    const { container } = widget.render({ styles: { boxShadow: binding(shadow) } });
    await waitFor(() => expect(explorer(container)).toHaveStyle({ boxShadow: shadow }));
  });

  test('[JSONExplorer-CMP-001] frontend and server registrations agree on persisted defaults and public surface', () => {
    // Break this catches: editing one registry gives newly created and server-loaded apps different APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: 'JSONExplorer',
      defaultSize: { width: 15, height: 120 },
      properties: {
        theme: { validation: { defaultValue: 'solarized' } },
        shouldExpandEntireJSON: { validation: { defaultValue: true } },
        shouldShowRootNode: { validation: { defaultValue: true } },
        dynamicHeight: { validation: { defaultValue: false } },
      },
      styles: { borderColor: { validation: { defaultValue: 'var(--cc-weak-border)' } } },
      exposedVariables: { value: DEFAULT_VALUE, isVisible: true, isLoading: false, isDisabled: false },
    });
    expect(frontendConfig.actions.map(({ handle }) => handle)).toEqual([
      'setVisibility',
      'setLoading',
      'setDisable',
      'setValue',
    ]);
  });

  test('[JSONExplorer-A11Y-001] disclosure remains pointer-operable without keyboard semantics', async () => {
    // Break this catches: changing rejected third-party accessibility behavior without revisiting decision D-02.
    const { container } = widget.render({ properties: { value: valueBinding({ branch: { leaf: 'deep' } }) } });
    await expectVisibleText(container, '"deep"');
    const control = disclosure(container, 'branch');

    expect(container.querySelector('[role="button"], [role="treeitem"]')).toBeNull();
    expect(control).not.toHaveAttribute('tabindex');
    expect(control).not.toHaveAttribute('aria-expanded');

    await widget.session.user.tab();
    expect(document.activeElement).not.toBe(control);
    await widget.session.user.keyboard('{Enter}');
    expect(exactText(container, '"deep"')).toBeVisible();

    await widget.session.user.click(control);
    await expectHiddenText(container, '"deep"');
  });

  test('[JSONExplorer-ACT-001] setValue accepts and renders scalar values rejected by the property schema', async () => {
    // Break this catches: enforcing the property union on the action changes behavior preserved by decision D-03.
    const { container } = widget.render();
    const cases = [
      ['scalar', '"scalar"'],
      [0, '0'],
      [false, 'false'],
      [null, 'null'],
    ];

    for (const [value, rendered] of cases) {
      await widget.act('setValue', value);
      await expectVisibleText(container, rendered);
      expect(widget.exposed().value).toBe(value);
    }
  });
});
