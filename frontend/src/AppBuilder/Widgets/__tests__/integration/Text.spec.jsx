/**
 * Text widget behaviour, against the approved contract at
 * `ee/test/app-builder/widgets/Text/TESTING.md`.
 *
 * Every maintained title starts with its approved scenario ID. Scenarios the
 * contract defers (Text-CSA-006, Text-CSA-007, Text-EVT-004, Text-SEC-002) are
 * deliberately absent: each needs a production fix that the contract's
 * `production_changes: forbidden` excludes, and a test asserting today's output
 * would bless the defect.
 *
 * Load-bearing setup, all of it non-obvious:
 *
 * 1. `componentDefinition()` seeds a widget's OWN registered definition
 *    (test/app-builder/seed.js), which is what reproduces production here: the
 *    server's `mergeDefaultComponentData` (util.service.ts:671-740) injects those
 *    same registered defaults into every app on read. So a test states only what
 *    it varies. Hand-listing defaults instead would drift, and omitting them
 *    would reproduce the unreachable state the contract excludes under D-09 as a
 *    seeding artifact (`text-indent: undefinedpx`, `font-style: none`).
 *
 * 1b. `properties.text` carries a `{type:'string'}` validation schema, so
 *    `validateComponent` (debuggerSlice.js:104-167) normalizes every binding
 *    through `validateProperties` (_utils/component-properties-validation.js:119-161)
 *    BEFORE the widget renders. The widget only ever receives a string — which is
 *    why `computeText()`'s `=== 0`/`=== false` branches and the
 *    `typeof text === 'object'` guards are unreachable here, and why Text-VAL-002
 *    uses the debugger report as its oracle rather than the emptied DOM.
 *
 * 2. `react-markdown` is stubbed to a pass-through (`__mocks__/reactMarkdown.jsx`),
 *    which renders `data-testid="react-markdown"` and drops className. So
 *    Text-FMT-002 can assert the markdown BRANCH was taken and handed its source
 *    through — not that markdown parsed. Real parsing and the D-02 sanitization
 *    gap are QA's (Text-BRW-004).
 *
 * 3. jsdom never loads `_styles/theme.scss`, so the global
 *    `.disabled { pointer-events: none }` that actually stops a disabled or
 *    loading Text responding does not exist here. That is why D-07 put the
 *    interaction gate in QA (Text-BRW-006) and left only the `data-disabled`
 *    marking and the `disabled` class to Text-STATE-003.
 */
import { screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  drain,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'txt1';
const NAME = 'text1';

const widget = createWidgetHarness({ componentType: 'Text', handle: NAME, id: ID });

const wrapper = (handle = NAME) => document.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const root = (handle = NAME) => wrapper(handle).querySelector('.text-widget');
const section = (handle = NAME) => wrapper(handle).querySelector('.text-widget-section');
const exposedOf = (id = ID) => store().getExposedValueOfComponent(id, MODULE_ID);

describe('Text: content formats', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-FMT-001] plain text renders literally and is exposed unchanged', async () => {
    // Break this catches: routing plainText through the HTML arm would render an
    // author's escaped sample markup as live elements — the whole point of the
    // Plain text option is that it does not interpret what it is given.
    const authored = '<b>not bold</b> & <script>alert(1)</script>';
    widget.render({ properties: { textFormat: binding('plainText'), text: binding(authored) } });

    expect(await screen.findByText(authored)).toBeInTheDocument();
    expect(root().querySelector('b')).toBeNull();
    expect(root().querySelector('script')).toBeNull();
    await waitFor(() => expect(exposedOf().text).toBe(authored));
  });

  test('[Text-FMT-002] markdown content is routed through the markdown renderer', async () => {
    // Break this catches: dropping the format switch sends markdown down the
    // plain-text arm, so every markdown Text in every app renders its source.
    widget.render({ properties: { textFormat: binding('markdown'), text: binding('# Heading') } });

    const markdown = await screen.findByTestId('react-markdown');
    expect(markdown).toHaveTextContent('# Heading');
  });

  test('[Text-FMT-003] a widget with the shipped defaults renders through the HTML arm', async () => {
    // Break this catches: changing the drop-time default format (text.js:303)
    // silently changes what every newly dropped Text does with authored markup.
    // Only `text` is overridden here — `textFormat` stays exactly as registered.
    widget.render({ properties: { text: binding('<strong>Live</strong> markup') } });

    await waitFor(() => expect(root().querySelector('strong')).not.toBeNull());
    expect(root().querySelector('strong')).toHaveTextContent('Live');
  });

  test('[Text-FMT-004] switching the format re-renders in place and leaves the exposed text alone', async () => {
    // Break this catches: a format switch that remounts the widget would throw
    // away CSA-set text and re-run the mount effect; one that fails to re-render
    // would leave the user looking at the previous format.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('<em>x</em>') } });
    expect(await screen.findByText('<em>x</em>')).toBeInTheDocument();

    widget.setComponentProperty(ID, 'textFormat', 'html', 'properties');

    await waitFor(() => expect(root().querySelector('em')).not.toBeNull());
    expect(exposedOf().text).toBe('<em>x</em>');
  });
});

describe('Text: values and exposed variables', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-VAL-001] a number binding renders as its string form', async () => {
    // Break this catches: removing the string schema from `properties.text`
    // (text.js:26-29), which is what drives the coercion in validateProperties. A Text bound to a numeric total would then receive a
    // number, and `{{components.text1.text.trim()}}` in any app reading it
    // becomes a runtime error.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('{{42}}') } });

    expect(await screen.findByText('42')).toBeInTheDocument();
    await waitFor(() => expect(exposedOf().text).toBe('42'));
    expect(store().debugger.logs.filter((entry) => entry.componentId === ID)).toHaveLength(0);
  });

  test('[Text-VAL-001] zero renders rather than vanishing', async () => {
    // Break this catches: a truthiness guard anywhere on the path. A count of
    // zero is the one number a dashboard most needs to show, and it is the one a
    // falsy check silently blanks.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('{{0}}') } });

    expect(await screen.findByText('0')).toBeInTheDocument();
    await waitFor(() => expect(exposedOf().text).toBe('0'));
  });

  test('[Text-VAL-001] booleans, null, undefined and NaN render as empty content without throwing', async () => {
    // Break this catches: the schema coercing these to their literal spelling
    // instead of to empty, so a Text bound to a flag that has not loaded yet
    // starts printing "undefined" or "NaN" on the page.
    for (const expr of ['{{true}}', '{{false}}', '{{null}}', '{{undefined}}', '{{NaN}}']) {
      widget.render({ properties: { textFormat: binding('plainText'), text: binding(expr) } });
      await waitFor(() => expect(section()).not.toBeNull());
      expect(section()).toHaveTextContent('');
      expect(exposedOf().text).toBe('');
    }
  });

  test('[Text-VAL-002] a value the string schema cannot coerce empties the widget and is reported to the debugger', async () => {
    // Break this catches: dropping the debugger report for a schema-rejected
    // binding. The emptiness alone is NOT a sufficient oracle — an empty Text
    // looks identical whether the binding was rejected or was genuinely empty,
    // so only the report tells a builder why their object binding shows nothing.
    // It also pins that the rejected value never reaches a render arm, which is
    // what makes the `typeof text === 'object'` guards dead code.
    widget.render({ properties: { text: binding('hello') } });
    await waitFor(() => expect(exposedOf().text).toBe('hello'));
    expect(store().debugger.logs.filter((entry) => entry.componentId === ID)).toHaveLength(0);

    widget.render({ properties: { text: binding('{{ ({ id: 1 }) }}') } });
    await waitFor(() => expect(section()).not.toBeNull());
    await drain();

    expect(exposedOf().text).toBe('');
    // Not the declared `validation.defaultValue` — validateProperties reads
    // `validation.schema.defaultValue` (component-properties-validation.js:124),
    // one level deeper than text.js:28 declares it, so the literal never reaches
    // a rendered widget; findDefault({type:'string'}) supplies '' instead.
    expect(section()).not.toHaveTextContent('Hello, there!');
    const [log] = store().debugger.logs.filter((entry) => entry.componentId === ID);
    expect(log).toBeDefined();
    expect(log.logLevel).toBe('error');
    expect(log.error.effectiveProperty).toEqual({ text: '' });
  });

  test('[Text-EXP-001] all four documented exposed variables are readable after mount', async () => {
    // Break this catches: dropping any of the three unregistered variables from
    // the mount effect leaves `{{components.text1.isVisible}}` permanently
    // undefined, because only `text` is seeded from the registration.
    widget.render({ properties: { text: binding('anything') } });

    await waitFor(() => expect(exposedOf().text).toBe('anything'));
    expect(exposedOf().isVisible).toBe(true);
    expect(exposedOf().isLoading).toBe(false);
    expect(exposedOf().isDisabled).toBe(false);
  });
});

describe('Text: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-CSA-001] setText updates the rendered text and the exposed variable', async () => {
    // Break this catches: a setText that writes only the exposed variable would
    // leave the page showing stale text while queries read the new value.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('before') } });
    expect(await screen.findByText('before')).toBeInTheDocument();

    await widget.act('setText', 'after');

    expect(await screen.findByText('after')).toBeInTheDocument();
    expect(exposedOf().text).toBe('after');
  });

  test('[Text-CSA-002] the state actions update the DOM and their exposed flag, and coerce their argument', async () => {
    // Break this catches: dropping the `!!` coercion (Text.jsx:127-142) exposes
    // whatever the app passed, so `{{components.text1.isVisible}}` starts
    // returning '' or 1 instead of a boolean an app can branch on.
    widget.render({ properties: { text: binding('x') } });
    await waitFor(() => expect(exposedOf().isVisible).toBe(true));

    await widget.act('setVisibility', '');
    expect(exposedOf().isVisible).toBe(false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));

    await widget.act('setLoading', 1);
    expect(exposedOf().isLoading).toBe(true);

    await widget.act('setDisable', 'yes');
    expect(exposedOf().isDisabled).toBe(true);
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
  });

  test('[Text-CSA-002] the unregistered visibility() handle aliases setVisibility()', async () => {
    // Break this catches: removing the legacy `visibility` handle during a
    // refactor. It is absent from text.js:271-296 and from the docs, so nothing
    // else in the repository would notice, but RunJS callers depend on it.
    widget.render({ properties: { text: binding('x') } });
    await waitFor(() => expect(exposedOf().visibility).toBeInstanceOf(Function));
    expect(exposedOf().setVisibility).toBeInstanceOf(Function);

    await widget.act('visibility', false);

    expect(exposedOf().isVisible).toBe(false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
  });

  test('[Text-CSA-003] clear empties the rendered text and exposes an empty string', async () => {
    // Break this catches: a clear that leaves `text` undefined instead of ''
    // turns `{{components.text1.text.length}}` into a runtime error in every
    // app that reads it after clearing.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('something') } });
    expect(await screen.findByText('something')).toBeInTheDocument();

    await widget.act('clear');

    await waitFor(() => expect(exposedOf().text).toBe(''));
    expect(screen.queryByText('something')).not.toBeInTheDocument();
  });

  test('[Text-CSA-004] setText survives an unrelated property change and a no-op rewrite of text', async () => {
    // Break this catches: widening the text effect's dependencies (Text.jsx:96)
    // to the whole properties object. Every unrelated resolution would then
    // revert text set by a CSA — the exact defect D-04 records for the other
    // three state actions, which share one dep array.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('original') } });
    await widget.act('setText', 'set-by-action');
    expect(await screen.findByText('set-by-action')).toBeInTheDocument();

    widget.setComponentProperty(ID, 'disabledState', '{{true}}', 'properties');
    await drain();
    expect(screen.getByText('set-by-action')).toBeInTheDocument();

    widget.setComponentProperty(ID, 'text', 'original', 'properties');
    await drain();
    expect(screen.getByText('set-by-action')).toBeInTheDocument();
    expect(exposedOf().text).toBe('set-by-action');
  });

  test('[Text-CSA-005] a genuinely changed text property overrides an earlier setText', async () => {
    // Break this catches: a CSA that pins local state permanently would mask
    // every later query-driven update — the page would freeze on whatever the
    // action last wrote.
    widget.render({ properties: { textFormat: binding('plainText'), text: binding('original') } });
    await widget.act('setText', 'set-by-action');
    expect(await screen.findByText('set-by-action')).toBeInTheDocument();

    widget.setComponentProperty(ID, 'text', 'from-query', 'properties');

    expect(await screen.findByText('from-query')).toBeInTheDocument();
    await waitFor(() => expect(exposedOf().text).toBe('from-query'));
  });
});

describe('Text: events', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-EVT-001] onClick fires exactly once per click', async () => {
    // Break this catches: binding the handler on both the root and the content
    // subtree, so a click bubbles into two firings and every wired query runs
    // twice. A constant-writing oracle could not see that.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('click me') },
      events: countInvocationsOn(ID, 'onClick'),
    });
    await screen.findByText('click me');

    await widget.session.user.click(root());
    await waitFor(() => expect(store().getVariable('calls', MODULE_ID)).toBe(1));

    await widget.session.user.click(root());
    await waitFor(() => expect(store().getVariable('calls', MODULE_ID)).toBe(2));
  });
});

describe('Text: visibility, loading and disabled states', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-STATE-001] visibility false hides the component', async () => {
    // Break this catches: an inverted or dropped visibility gate, which would
    // publish content an app deliberately hid.
    widget.render({ properties: { text: binding('secret'), visibility: binding('{{false}}') } });

    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
  });

  test('[Text-STATE-002] loadingState replaces the content with a loader', async () => {
    // Break this catches: rendering the loader ALONGSIDE the content, so a Text
    // waiting on a query shows stale data next to a spinner.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('stale data'), loadingState: binding('{{true}}') },
    });

    await waitFor(() => expect(section()).toBeNull());
    expect(screen.queryByText('stale data')).not.toBeInTheDocument();
    expect(wrapper().querySelector('.tj-widget-loader, svg, .loader')).not.toBeNull();
  });

  test('[Text-STATE-003] disabledState marks the widget and its canvas wrapper disabled', async () => {
    // Break this catches: adding Text to RenderWidget's Modal/ModalV2/
    // CircularProgressBar exclusion list, or dropping `data-disabled`. The
    // `disabled` class is what carries the global pointer-events:none that
    // actually stops interaction in a browser (verified by QA, Text-BRW-006).
    widget.render({ properties: { text: binding('x'), disabledState: binding('{{true}}') } });

    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
    expect(wrapper().className).toContain('disabled');
  });
});

describe('Text: an unset format', () => {
  const bare = createWidgetHarness({ componentType: 'Text', handle: NAME, id: ID });
  beforeEach(bare.setup);
  afterEach(bare.teardown);

  test('[Text-FMT-005] a Text with no format configured renders through the HTML arm, sanitized', async () => {
    // Break this catches: changing the `|| !textFormat` fallback (Text.jsx:224)
    // to land on plainText. That looks harmless — text still appears — but the
    // HTML arm is also the ONLY sanitizing arm, so the fallback silently decides
    // the trust policy, not just the rendering.
    bare.render({
      properties: {
        textFormat: undefined,
        text: binding('<strong>Live</strong><img src="x" onerror="window.__fmt5 = true">'),
      },
    });

    await waitFor(() => expect(root().querySelector('strong')).not.toBeNull());
    expect(root().querySelector('img')).not.toHaveAttribute('onerror');
    expect(window.__fmt5).toBeUndefined();
  });
});

describe('Text: untrusted content', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-SEC-001] authored HTML is sanitized before it reaches the DOM', async () => {
    // Break this catches: dropping DOMPurify from the HTML arm (Text.jsx:228).
    // `text` is a bindable field, so query data reaches it — an app rendering a
    // record's HTML column would then run whatever that column contains on every
    // viewer's canvas.
    widget.render({
      properties: {
        textFormat: binding('html'),
        text: binding('<em>safe</em><img src="x" onerror="window.__xss = true"><script>window.__xss2 = true</script>'),
      },
    });

    await waitFor(() => expect(root().querySelector('em')).not.toBeNull());
    expect(root().querySelector('em')).toHaveTextContent('safe');
    expect(root().querySelector('img')).not.toHaveAttribute('onerror');
    expect(root().querySelector('script')).toBeNull();
    expect(window.__xss).toBeUndefined();
    expect(window.__xss2).toBeUndefined();
  });
});

describe('Text: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-STY-001] the documented text styles reach the rendered element', async () => {
    // Break this catches: dropping a style from `computedStyles`/`commonStyles`
    // (Text.jsx:158-194), so an Inspector control silently stops doing anything
    // while still showing the builder's chosen value.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('styled') },
      styles: {
        textSize: binding('{{20}}'),
        fontWeight: binding('bold'),
        fontStyle: binding('italic'),
        lineHeight: binding('{{2}}'),
        decoration: binding('underline'),
        transformation: binding('uppercase'),
        fontVariant: binding('small-caps'),
        textIndent: binding('{{12}}'),
        letterSpacing: binding('{{3}}'),
        wordSpacing: binding('{{5}}'),
        textAlign: binding('right'),
        verticalAlignment: binding('bottom'),
      },
    });
    await screen.findByText('styled');

    expect(root()).toHaveStyle({
      fontSize: '20px',
      fontWeight: 'bold',
      fontStyle: 'italic',
      lineHeight: '2',
      textDecoration: 'underline',
      textTransform: 'uppercase',
      fontVariant: 'small-caps',
      textIndent: '12px',
      letterSpacing: '3px',
      wordSpacing: '5px',
    });
    // Alignment lives on the inner section, not the root.
    expect(section()).toHaveStyle({ textAlign: 'right', justifyContent: 'flex-end' });
  });

  test('[Text-STY-002] container styles apply and the widget-level box shadow wins over the universal one', async () => {
    // Break this catches: reversing the spread order in RenderWidget's style
    // merge (RenderWidget.jsx:167). The universal `generalStyles.boxShadow`
    // would then override the Box shadow the builder set on THIS widget, and
    // every Text would render the universal default instead.
    widget.render({
      properties: { text: binding('x') },
      styles: {
        backgroundColor: binding('#123456'),
        borderColor: binding('#abcdef'),
        borderRadius: binding('{{8}}'),
        boxShadow: binding('1px 2px 3px 4px #654321'),
      },
      afterSeed: () => widget.setComponentProperty(ID, 'boxShadow', '9px 9px 9px 9px #000000', 'generalStyles'),
    });

    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveStyle({
      backgroundColor: '#123456',
      borderColor: '#abcdef',
      borderRadius: '8px',
      boxShadow: '1px 2px 3px 4px #654321',
    });
  });

  test('[Text-STY-003] dark mode substitutes only the three special-cased colours', async () => {
    // Break this catches: widening the dark-mode substitution beyond its three
    // exact hex values (Text.jsx:63,161,178), which would start overriding
    // colours a builder deliberately chose for their dark theme.
    widget.render({
      properties: { text: binding('x') },
      darkMode: true,
      styles: { textColor: binding('#000000'), backgroundColor: binding('#edeff5') },
    });
    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveStyle({ color: '#fff', backgroundColor: '#2f3c4c' });

    widget.render({
      properties: { text: binding('x') },
      darkMode: true,
      styles: { textColor: binding('#ff0000'), backgroundColor: binding('#00ff00') },
    });
    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveStyle({ color: '#ff0000', backgroundColor: '#00ff00' });
  });

  test('[Text-STY-004] a style cleared to an empty string falls back to its registered default', async () => {
    // Break this catches: removing the empty-string rescue in getDefaultStyles
    // (debuggerSlice.js:74-85). Clearing a style field in the Inspector would
    // then emit an empty value rather than the registered default, and the text
    // would silently inherit whatever the canvas happened to set.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('defaulted') },
      styles: { textSize: binding('') },
    });
    await screen.findByText('defaulted');

    expect(root()).toHaveStyle({ fontSize: '14px' });
  });

  test('[Text-STY-005] scroll configuration applies, and is deliberately inert under dynamic height', async () => {
    // Break this catches: dropping the `!isDynamicHeightEnabled` guard
    // (Text.jsx:190-193). A dynamic-height Text would regain an overflow rule
    // and clip its own content at the authored height — the very thing dynamic
    // height exists to prevent.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('scrolly') },
      styles: { isScrollRequired: binding('enabled') },
    });
    await screen.findByText('scrolly');
    expect(section()).toHaveStyle({ overflowY: 'auto' });

    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('scrolly') },
      styles: { isScrollRequired: binding('disabled') },
    });
    await screen.findByText('scrolly');
    expect(section()).toHaveStyle({ overflowY: 'hidden', overflowX: 'hidden' });

    widget.render({
      properties: {
        textFormat: binding('plainText'),
        text: binding('scrolly'),
        dynamicHeight: binding('{{true}}'),
      },
      styles: { isScrollRequired: binding('disabled') },
      currentMode: 'view',
    });
    await screen.findByText('scrolly');
    expect(section().style.overflowY).toBe('');
  });
});

describe('Text: dynamic height', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-DH-001] dynamic height applies in the viewer and not in the editor', async () => {
    // Break this catches: dropping the `currentMode === 'view'` gate
    // (Text.jsx:64). Every Text on the editor canvas would start resizing itself
    // away from the height the builder dragged it to.
    widget.render({
      properties: { text: binding('x'), dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveStyle({ height: '36px' });

    widget.render({
      properties: { text: binding('x'), dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    await waitFor(() => expect(root()).not.toBeNull());
    expect(root()).toHaveStyle({ height: 'auto', minHeight: '36px' });
  });

  test('[Text-DH-002] turning dynamic height off releases its observers', async () => {
    // Break this catches: dropping the cleanup return from useHeightObserver
    // (useHeightObserver.jsx:74-78). Each toggle would leak a ResizeObserver and
    // a MutationObserver wired to a detached node, and a page that toggles
    // dynamic height from a query would accumulate them for its whole session.
    const live = { resize: 0, mutation: 0 };
    const RealResize = window.ResizeObserver;
    const RealMutation = window.MutationObserver;
    class CountingResize extends RealResize {
      constructor(cb) {
        super(cb);
        live.resize += 1;
      }
      disconnect() {
        live.resize -= 1;
        return super.disconnect();
      }
    }
    class CountingMutation extends RealMutation {
      constructor(cb) {
        super(cb);
        live.mutation += 1;
      }
      disconnect() {
        live.mutation -= 1;
        return super.disconnect();
      }
    }
    window.ResizeObserver = CountingResize;
    window.MutationObserver = CountingMutation;

    try {
      widget.render({
        properties: { text: binding('x'), dynamicHeight: binding('{{true}}') },
        currentMode: 'view',
      });
      await waitFor(() => expect(live.resize).toBeGreaterThan(0));
      expect(live.mutation).toBeGreaterThan(0);

      widget.setComponentProperty(ID, 'dynamicHeight', '{{false}}', 'properties');

      await waitFor(() => expect(live.resize).toBe(0));
      expect(live.mutation).toBe(0);
    } finally {
      window.ResizeObserver = RealResize;
      window.MutationObserver = RealMutation;
    }
  });
});

describe('Text: instance isolation', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Text-ISO-001] two Text widgets keep independent content, state and event counts', async () => {
    // Break this catches: any state the widget keeps at module scope rather than
    // per instance. Text already holds a module-level `count` (Text.jsx:19,65);
    // if a future change moves real state there, every Text on the page would
    // show the same content and one click would bill every instance.
    widget.render({
      properties: { textFormat: binding('plainText'), text: binding('first') },
      events: countInvocationsOn(ID, 'onClick'),
      extraComponents: {
        txt2: componentDefinition('txt2', 'text2', 'Text', {
          textFormat: binding('plainText'),
          text: binding('second'),
        }),
      },
      also: [{ id: 'txt2', componentType: 'Text' }],
    });
    expect(await screen.findByText('first')).toBeInTheDocument();
    expect(await screen.findByText('second')).toBeInTheDocument();

    await widget.act('setText', 'first-changed');

    expect(await screen.findByText('first-changed')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(exposedOf('txt2').text).toBe('second');

    await widget.session.user.click(root(NAME));
    await waitFor(() => expect(store().getVariable('calls', MODULE_ID)).toBe(1));

    await widget.session.user.click(root('text2'));
    await drain();
    expect(store().getVariable('calls', MODULE_ID)).toBe(1);
  });
});

describe('Text: the licensed CSS class', () => {
  // Commissioned by D-10: `styles.cssClass` is universal (merged into every
  // widget by componentTypes.js:14-16) and licence-gated in RenderWidget, and
  // nothing on this branch covers it.
  //
  // D-10 approved extracting this into a shared
  // AppCanvas/__tests__/integration/RenderWidgetCssClass.spec.jsx. That file is
  // already written in PR #17964 (with a single `[Html-CSS-001]` test) and is
  // pending merge into lts-3.16, so creating a second copy here would collide.
  // Per D-10's own wording the scenario therefore stays LOCAL until that test
  // exists, at which point this block moves out and the contract row becomes a
  // `shared:` disposition. The BoundedBox contract already cites Html-CSS-001
  // and needs no change.
  //
  // The behaviour under test is RenderWidget's, not Text's — Text is only the
  // cheapest real widget to hang a class on. The licence is driven through its
  // REAL path (`updateFeatureAccess()` → `licenseService.getFeatureAccess()`)
  // with only the HTTP boundary controlled.
  const LICENSE_URL = 'http://localhost:3000/api/license/access';
  const withLicense = (customStyling) =>
    createWidgetHarness({
      componentType: 'Text',
      handle: NAME,
      id: ID,
      capabilities: { network: [{ method: 'get', url: LICENSE_URL, json: { customStyling } }] },
    });

  const savedCssClass = () => store().getComponentDefinition(ID, MODULE_ID).component.definition.styles.cssClass;

  async function fetchLicense(expected) {
    store().updateFeatureAccess();
    await waitFor(() => expect(store().isLicenseFetched).toBe(true));
    expect(store().license.featureAccess.customStyling).toBe(expected);
  }

  test('[Text-CSS-001] an authored class reaches the widget node when customStyling is licensed', async () => {
    // Break this catches: inverting or dropping the licence gate
    // (RenderWidget.jsx:304), or dropping userCssClass from the className list.
    // Every app whose custom CSS targets a widget class would lose its styling,
    // with no error anywhere.
    const widget2 = withLicense(true);
    widget2.setup();
    try {
      await fetchLicense(true);
      widget2.render({ properties: { text: binding('x') }, styles: { cssClass: binding('brand-callout') } });

      await waitFor(() => expect(wrapper().className).toContain('brand-callout'));
      // The platform's own classes must survive alongside the authored one.
      expect(wrapper().className).toContain('canvas-component');
    } finally {
      widget2.teardown();
    }
  });

  test('[Text-CSS-001] the class is withheld without the licence, and the saved value is never erased', async () => {
    // Break this catches: "cleaning up" the withheld class by clearing it from
    // the schema. Downgrading would then destroy every authored class, and
    // re-licensing would silently restore nothing.
    const widget2 = withLicense(false);
    widget2.setup();
    try {
      await fetchLicense(false);
      widget2.render({ properties: { text: binding('x') }, styles: { cssClass: binding('brand-callout') } });

      await waitFor(() => expect(wrapper()).not.toBeNull());
      expect(wrapper().className).not.toContain('brand-callout');
      expect(savedCssClass()).toEqual(binding('brand-callout'));
    } finally {
      widget2.teardown();
    }
  });
});
