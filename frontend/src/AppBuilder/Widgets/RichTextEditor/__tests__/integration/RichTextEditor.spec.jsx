import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { richtextareaConfig } from '@tooljet/widget-definitions';
import { buildComponentMetaDefinition } from '@/_helpers/appUtils';
import { componentDefinition } from '@/test/app-builder';

// Engineering scenarios for the RichTextEditor (display name "Text Editor").
// Contract: frontend/ee/test/app-builder/widgets/RichTextEditor/TESTING.md.
// Characterization specs: each is GREEN against current production and was
// proven RED by the fault named in its `// Break this catches:` note.

const ID = 'richtexteditor1';

const widget = createWidgetHarness({
  componentType: 'RichTextEditor',
  handle: ID,
  id: ID,
  defaultProperties: {
    placeholder: binding('Placeholder text'),
    defaultValue: binding(''),
    loadingState: binding('{{false}}'),
    dynamicHeight: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

// The widget's own outer wrapper carries data-cy = component name plus
// display / boxShadow / data-disabled / aria-*. RenderWidget's own wrapper is
// the separate `draggable-widget-<name>` node.
const outer = () => document.querySelector(`[data-cy="${ID}"]`);
const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);

describe('RichTextEditor widget', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[RichTextEditor-VALUE-001] mount publishes value equal to the configured defaultValue', async () => {
    // Break this catches: dropping `value: this.props.defaultValue` from the
    // mount exposed-variables (DraftEditor.jsx:210), so every app reads an
    // empty `{{richtexteditor1.value}}` until the user first types.
    widget.render({ properties: { defaultValue: binding('<p>Hello</p>') } });

    await waitFor(() => expect(exposed().value).toBe('<p>Hello</p>'));
  });

  test('[RichTextEditor-VAR-001] mount publishes isDisabled, isVisible, and isLoading', async () => {
    // Break this catches: isDisabled/isVisible/isLoading no longer exposed on
    // mount. They are published redundantly — by DraftEditor.componentDidMount
    // (DraftEditor.jsx:211-213) AND by RichTextEditor's post-mount effects
    // (RichTextEditor.jsx:52-63, which run on mount because the child's
    // componentDidMount flips isInitialRender before the parent's passive
    // effects). This asserts the net result a consumer reads on load; the fault
    // is removing both publishers (proven RED by disabling both isVisible paths).
    widget.render({});

    await waitFor(() => expect(exposed().isDisabled).toBe(false));
    expect(exposed().isVisible).toBe(true);
    expect(exposed().isLoading).toBe(false);
  });

  test('[RichTextEditor-BIND-001] a defaultValue binding change republishes value', async () => {
    // Break this catches: dropping the componentDidUpdate defaultValue branch
    // (DraftEditor.jsx:188-197), so a new `{{defaultValue}}` never re-inits the
    // editor and `value` stays stale.
    widget.render({ properties: { defaultValue: binding('<p>one</p>') } });
    await waitFor(() => expect(exposed().value).toBe('<p>one</p>'));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'defaultValue', '<p>two</p>', 'properties');
    });

    await waitFor(() => expect(exposed().value).toContain('two'));
    expect(exposed().value).not.toContain('one');
  });

  test('[RichTextEditor-CSA-001] setValue updates the exposed value', async () => {
    // Break this catches: setValue not calling handleChange (DraftEditor.jsx:217-223),
    // so the CSA silently no-ops on `value`.
    widget.render({ properties: { defaultValue: binding('<p>start</p>') } });
    await waitFor(() => expect(exposed().value).toBe('<p>start</p>'));

    await widget.act('setValue', '<p>changed</p>');

    await waitFor(() => expect(exposed().value).toContain('changed'));
    expect(exposed().value).not.toContain('start');
  });

  test('[RichTextEditor-SEC-001] setValue sanitizes an unsafe URL before exposing value', async () => {
    // Break this catches: dropping DOMPurify.sanitize from setValue
    // (DraftEditor.jsx:218), so a javascript: link survives the round-trip into
    // the exposed `value`.
    widget.render({});

    await widget.act('setValue', '<a href="javascript:alert(1)">click</a>');

    await waitFor(() => expect(exposed().value).toContain('click'));
    expect(exposed().value).not.toContain('javascript:');
  });

  test('[RichTextEditor-SEC-002] the placeholder is sanitized before it reaches the DOM', async () => {
    // Break this catches: dropping DOMPurify.sanitize on the placeholder
    // (DraftEditor.jsx:318) — the placeholder is written via
    // dangerouslySetInnerHTML, the one real XSS sink in this widget.
    widget.render({
      properties: {
        defaultValue: binding(''),
        placeholder: binding('<img src=x onerror="window.__xss=1">clean'),
      },
    });

    await waitFor(() => expect(outer()).toBeInTheDocument());
    await waitFor(() => expect(outer().innerHTML).toContain('clean'));
    expect(outer().innerHTML).not.toContain('onerror');
  });

  test('[RichTextEditor-CSA-002] setDisable publishes isDisabled and the wrapper disabled attributes', async () => {
    // Break this catches: setDisable not updating both the exposed variable and
    // local state (DraftEditor.jsx:224-227 -> RichTextEditor.jsx:75,87), so a
    // disabled editor keeps mouse interaction.
    widget.render({});
    await waitFor(() => expect(exposed().setDisable).toBeInstanceOf(Function));

    await widget.act('setDisable', true);

    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(outer()).toHaveAttribute('data-disabled', 'true');
    expect(outer()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[RichTextEditor-CSA-003] setVisibility publishes isVisible and hides the wrapper', async () => {
    // Break this catches: setVisibility not updating both the exposed variable
    // and local state (DraftEditor.jsx:228-231 -> RichTextEditor.jsx:79), so
    // hide-via-action leaves the widget on screen.
    widget.render({});
    await waitFor(() => expect(exposed().setVisibility).toBeInstanceOf(Function));

    await widget.act('setVisibility', false);

    await waitFor(() => expect(exposed().isVisible).toBe(false));
    expect(outer()).toHaveStyle({ display: 'none' });
  });

  test('[RichTextEditor-CSA-004] setLoading publishes isLoading and swaps the editor for the loader', async () => {
    // Break this catches: dropping the isLoading render branch
    // (DraftEditor.jsx:275-281), so setLoading never shows the loader.
    widget.render({});
    expect(await screen.findByText('Heading')).toBeInTheDocument();

    await widget.act('setLoading', true);

    await waitFor(() => expect(exposed().isLoading).toBe(true));
    expect(screen.queryByText('Heading')).not.toBeInTheDocument();
  });

  test('[RichTextEditor-PREC-001] a CSA setDisable survives an unrelated property re-resolve', async () => {
    // Break this catches: re-syncing local disabled state from the property on
    // an unrelated re-resolve (RichTextEditor.jsx:44-48), which would clobber a
    // CSA setDisable when any other prop changes.
    widget.render({ properties: { placeholder: binding('one') } });
    await widget.act('setDisable', true);
    await waitFor(() => expect(exposed().isDisabled).toBe(true));
    expect(outer()).toHaveAttribute('data-disabled', 'true');

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'placeholder', 'two', 'properties');
    });

    expect(exposed().isDisabled).toBe(true);
    expect(outer()).toHaveAttribute('data-disabled', 'true');
  });

  test('[RichTextEditor-FORM-001] a Form clear empties the editor and sets value to an empty string', async () => {
    // Break this catches: dropping the clearCount branch in componentDidUpdate
    // (DraftEditor.jsx:180-185), so a Form clearForm leaves the editor content
    // and `value` untouched.
    widget.renderInsideForm({ properties: { defaultValue: binding('<p>hello</p>') } });
    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID)?.value).toBe('<p>hello</p>'));

    await waitFor(() =>
      expect(store().getExposedValueOfComponent('form1', MODULE_ID)?.clearForm).toBeInstanceOf(Function)
    );
    await widget.session.store.act(async () => {
      await store().getExposedValueOfComponent('form1', MODULE_ID).clearForm();
    });

    await waitFor(() => expect(store().getExposedValueOfComponent(ID, MODULE_ID).value).toBe(''));
  });

  test('[RichTextEditor-STYLE-001] visibility=false sets the outer wrapper display:none', async () => {
    // Break this catches: dropping the `isVisible ? '' : 'none'` mapping
    // (RichTextEditor.jsx:79), so a hidden editor stays visible.
    widget.render({ styles: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(outer()).toBeInTheDocument());
    expect(outer()).toHaveStyle({ display: 'none' });
  });

  test('[RichTextEditor-STYLE-002] disabledState sets the wrapper disabled attributes', async () => {
    // Break this catches: dropping `data-disabled`/`aria-disabled` from the
    // wrapper (RichTextEditor.jsx:75,87), so the global pointer-events rule
    // never engages and a disabled editor stays editable.
    widget.render({ styles: { disabledState: binding('{{true}}') } });

    await waitFor(() => expect(outer()).toBeInTheDocument());
    expect(outer()).toHaveAttribute('data-disabled', 'true');
    expect(outer()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[RichTextEditor-STYLE-003] boxShadow is applied to the outer wrapper', async () => {
    // Break this catches: not forwarding the universal `boxShadow` style to the
    // outer node (RichTextEditor.jsx:23,80), so shadow styling silently no-ops.
    // Pinned to Custom: the registered definition now seeds new drops onto the theme (D-10).
    widget.render({ styles: { boxShadow: binding('0px 0px 5px red'), boxShadowStyle: binding('custom') } });

    await waitFor(() => expect(outer()).toBeInTheDocument());
    expect(outer()).toHaveStyle({ boxShadow: '0px 0px 5px red' });
  });
});

// Theme border radius / box shadow (contract D-10; Button's D-03..D-06 transferred).
describe('RichTextEditor: theme border radius and box shadow', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);
  const themedBox = () => document.querySelector('[data-cy="richtexteditor1"]');

  test('[RichTextEditor-THEME-001] a newly dropped RichTextEditor starts on the theme Large radius and no shadow, with the theme dropdowns', () => {
    // Break this catches: the config losing the new-drop defaults or the inspector's theme dropdowns.
    expect(richtextareaConfig.definition.styles.borderRadiusStyle).toEqual({ value: 'large' });
    expect(richtextareaConfig.definition.generalStyles.boxShadowStyle).toEqual({ value: 'none' });
    expect(richtextareaConfig.styles.borderRadius.themeTokens).toBe('borderRadius');
    expect(richtextareaConfig.generalStyles.boxShadow.themeTokens).toBe('shadows');
  });

  test('[RichTextEditor-THEME-002] a RichTextEditor saved before theme styles keeps its own radius and shadow after load', async () => {
    // Break this catches: the load merge stamping the new-drop defaults onto saved widgets.
    const saved = componentDefinition(
      'richtexteditor1',
      'richtexteditor1',
      'RichTextEditor',
      {},
      {
        styles: { borderRadius: binding('{{10}}') },
        seedFromRegisteredDefinition: false,
      }
    );
    saved.component.definition.generalStyles = { boxShadow: binding('5px 5px 0px 0px #00000040') };
    const { styles, generalStyles } = buildComponentMetaDefinition({ richtexteditor1: saved })['richtexteditor1']
      .component.definition;
    expect(styles).not.toHaveProperty('borderRadiusStyle');
    expect(styles).not.toHaveProperty('boxShadowStyle');
    expect(generalStyles ?? {}).not.toHaveProperty('boxShadowStyle');

    widget.render({
      styles: { ...styles, ...generalStyles, borderRadiusStyle: binding('custom'), boxShadowStyle: binding('custom') },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(themedBox().style.borderRadius).toBe('10px');
    expect(themedBox().style.boxShadow).toBe('5px 5px 0px 0px #00000040');
  });

  test('[RichTextEditor-THEME-003] a theme item renders its variable with the saved value as fallback; custom renders the saved value', async () => {
    // Break this catches: the widget rendering its raw radius / shadow whatever the theme style.
    widget.render({
      styles: {
        borderRadius: binding('{{6}}'),
        borderRadiusStyle: binding('medium'),
        boxShadow: binding('0px 0px 0px 0px #00000040'),
        boxShadowStyle: binding('300'),
      },
    });
    await waitFor(() => expect(themedBox()).toBeTruthy());
    expect(themedBox().style.borderRadius).toBe('var(--cc-border-radius-medium, 6px)');
    expect(themedBox().style.boxShadow).toBe('var(--cc-box-shadow-300, 0px 0px 0px 0px #00000040)');
    // The editor's own bordered box (DraftEditor) takes the wrapper's corners.
    expect(themedBox().querySelector('.RichEditor-root').style.borderRadius).toBe('inherit');

    widget.setComponentProperty('richtexteditor1', 'borderRadiusStyle', 'custom', 'styles');
    widget.setComponentProperty('richtexteditor1', 'borderRadius', '{{10}}', 'styles');
    await waitFor(() => expect(themedBox().style.borderRadius).toBe('10px'));
  });
});
