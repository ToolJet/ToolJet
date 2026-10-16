/**
 * Tags' approved Engineering contract.
 *
 * Contract: frontend/ee/test/app-builder/widgets/Tags/TESTING.md
 * Characterization branch: production_changes is forbidden. Tags-BND-002
 * (non-array `data` crash) is deferred per D-01 and has no test here.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { tagsConfig } from '@/AppBuilder/WidgetManager/widgets/tags';
import { binding, createWidgetHarness } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 't1';
const NAME = 'tags1';
const SHIPPED = tagsConfig.definition;

const widget = createWidgetHarness({
  componentType: 'Tags',
  handle: NAME,
  id: ID,
  defaultProperties: SHIPPED.properties,
  defaultStyles: SHIPPED.styles,
  widgetHeight: 40,
  widgetWidth: 300,
});

beforeEach(() => widget.setup());
afterEach(() => widget.teardown());

const instance = (name = NAME) => document.querySelector(`._tooljet-${name}`);
const wrapper = (name = NAME) => instance(name).querySelector('.tag-comp-wrapper');
const collection = (name = NAME) => instance(name).querySelector(`[data-cy="${name}-tags-container"]`);
const badges = (name = NAME) => [...instance(name).querySelectorAll('.badge')];
const titles = (name = NAME) => badges(name).map((b) => b.textContent);
const badge = (slug, name = NAME) => instance(name).querySelector(`[data-cy="${name}-tag-${slug}"]`);
const icon = (slug, name = NAME) => instance(name).querySelector(`[data-cy="${name}-tag-${slug}-icon"]`);
const dynamic = (literal) => ({ advanced: binding('{{true}}'), data: binding(`{{${literal}}}`) });

async function setProperty(name, value, paramType = 'properties', componentId = ID) {
  await widget.session.store.act(() => widget.setComponentProperty(componentId, name, value, paramType));
}

async function mounted(componentId = ID) {
  await waitFor(() => expect(widget.exposed(componentId).setVisibility).toBeInstanceOf(Function));
}

function staticOption(title, { visible = true, icon: iconName = 'IconHome', iconVisibility = true } = {}) {
  return {
    title,
    textColor: { value: 'rgb(1, 1, 1)' },
    backgroundColor: { value: 'rgb(2, 2, 2)' },
    icon: { value: iconName },
    iconVisibility: { value: `{{${iconVisibility}}}` },
    visible: { value: `{{${visible}}}` },
  };
}

describe('Tags widget', () => {
  test('[Tags-DEF-001] shipped definition renders the four static tags and publishes their titles', async () => {
    // Break this catches: static mode reading `data`, dropping resolved option colors, or a wrong default size/radius.
    widget.render();
    await mounted();

    expect(titles()).toEqual(['success', 'info', 'warning', 'danger']);
    const expectedColors = {
      success: ['rgba(52, 169, 71, 0.2)', 'rgb(52, 169, 71)'],
      info: ['rgba(64, 93, 230, 0.102)', 'rgb(64, 93, 230)'],
      warning: ['rgba(243, 87, 23, 0.102)', 'rgb(243, 87, 23)'],
      danger: ['rgba(235, 46, 57, 0.2)', 'rgb(235, 46, 57)'],
    };
    for (const [title, [background, text]] of Object.entries(expectedColors)) {
      const el = badge(title);
      expect(el.style.backgroundColor).toBe(background);
      expect(el.style.color).toBe(text);
      expect(el.style.height).toBe('20px');
      expect(el.style.fontSize).toBe('12px');
      expect(el.style.borderRadius).toBe('8px');
      await waitFor(() => expect(icon(title)).not.toBeNull());
    }
    expect(collection().style.justifyContent).toBe('flex-start');
    expect(wrapper().style.flexWrap).toBe('wrap');

    const exposed = widget.exposed();
    expect(exposed.tags).toEqual(['success', 'info', 'warning', 'danger']);
    expect(exposed.isVisible).toBe(true);
    expect(exposed.isLoading).toBe(false);
    expect(exposed.isDisabled).toBe(false);
  });

  test('[Tags-OPT-001] static option visibility and icon flags drive DOM, tags and counts together', async () => {
    // Break this catches: a hidden option still rendered/published, or " with icon" drifting from the rendered icon.
    widget.render({
      properties: {
        options: {
          value: [
            staticOption('alpha', { iconVisibility: false }),
            staticOption('beta', { visible: false }),
            staticOption('gamma'),
            staticOption('delta', { icon: '' }),
          ],
        },
      },
    });
    await mounted();

    expect(titles()).toEqual(['alpha', 'gamma', 'delta']);
    expect(widget.exposed().tags).toEqual(['alpha', 'gamma', 'delta']);
    expect(screen.getByRole('group', { name: 'Tags display: 3 tags' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tag collection with 3 items' })).toBeInTheDocument();

    await waitFor(() => expect(icon('gamma')).not.toBeNull());
    expect(badge('gamma')).toHaveAttribute('aria-label', 'gamma with icon');
    expect(icon('alpha')).toBeNull();
    expect(badge('alpha')).toHaveAttribute('aria-label', 'alpha');
    expect(icon('delta')).toBeNull();
    expect(badge('delta')).toHaveAttribute('aria-label', 'delta');
  });

  test('[Tags-OPT-002] advanced switches the source between static options and dynamic data', async () => {
    // Break this catches: the source switch rendering stale tags or not republishing `tags`.
    widget.render({ properties: { data: binding("{{[{title:'one'},{title:'two'}]}}") } });
    await mounted();
    expect(titles()).toEqual(['success', 'info', 'warning', 'danger']);

    await setProperty('advanced', '{{true}}');
    await waitFor(() => expect(titles()).toEqual(['one', 'two']));
    expect(widget.exposed().tags).toEqual(['one', 'two']);

    await setProperty('advanced', '{{false}}');
    await waitFor(() => expect(titles()).toEqual(['success', 'info', 'warning', 'danger']));
    expect(widget.exposed().tags).toEqual(['success', 'info', 'warning', 'danger']);
  });

  test('[Tags-DATA-001] dynamic data renders title, colors, icon and per-item visibility, including legacy color', async () => {
    // Break this catches: dropping the legacy `color` key migrated apps rely on, or `color` overriding `backgroundColor`.
    widget.render({
      properties: dynamic(
        "[{title:'modern', backgroundColor:'rgb(1, 2, 3)', color:'rgb(9, 9, 9)', textColor:'rgb(4, 5, 6)', icon:'IconHome', iconVisibility:true}," +
          "{title:'legacy', color:'rgb(10, 20, 30)', textColor:'rgb(40, 50, 60)'}," +
          "{title:'hidden', visible:false}]"
      ),
    });
    await mounted();

    expect(titles()).toEqual(['modern', 'legacy']);
    expect(widget.exposed().tags).toEqual(['modern', 'legacy']);
    expect(badge('modern').style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(badge('modern').style.color).toBe('rgb(4, 5, 6)');
    expect(badge('legacy').style.backgroundColor).toBe('rgb(10, 20, 30)');
    expect(badge('legacy').style.color).toBe('rgb(40, 50, 60)');
    await waitFor(() => expect(icon('modern')).not.toBeNull());
    expect(icon('legacy')).toBeNull();
  });

  test('[Tags-DATA-002] changing the bound data re-renders and republishes tags without stale entries', async () => {
    // Break this catches: `tags` or the DOM keeping titles from the previous array.
    widget.render({ properties: dynamic("[{title:'a'},{title:'b'},{title:'c'}]") });
    await mounted();
    expect(widget.exposed().tags).toEqual(['a', 'b', 'c']);

    await setProperty('data', "{{[{title:'x'}]}}");
    await waitFor(() => expect(titles()).toEqual(['x']));
    expect(widget.exposed().tags).toEqual(['x']);

    await setProperty('data', "{{[{title:'y'}]}}");
    await waitFor(() => expect(titles()).toEqual(['y']));
    expect(widget.exposed().tags).toEqual(['y']);
  });

  test.each([
    ['empty array', '[]'],
    ['null', 'null'],
  ])('[Tags-BND-001] %s data renders zero tags', async (_label, literal) => {
    // Break this catches: empty/null data crashing or leaving phantom tags/counts.
    widget.render({ properties: dynamic(literal) });
    await mounted();

    expect(badges()).toHaveLength(0);
    expect(screen.getByRole('group', { name: 'Tags display: 0 tags' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Tag collection with 0 items' })).toBeInTheDocument();
    expect(widget.exposed().tags).toEqual([]);
  });

  test('[Tags-BND-003] missing, non-primitive and odd values render safely', async () => {
    // Break this catches: rendering a raw object title (React crash) or an unknown icon name blanking the widget.
    widget.render({
      properties: dynamic(
        "[{color:'rgb(1, 1, 1)'},{title:{x:1}},{title:'odd', icon:'NotAnIcon', iconVisibility:true}]"
      ),
    });
    await mounted();

    expect(titles()).toEqual(['', '[object Object]', 'odd']);
    expect(widget.exposed().tags).toEqual([undefined, { x: 1 }, 'odd']);
    await waitFor(() => expect(icon('odd')).not.toBeNull());
    expect(instance().querySelector('[data-cy="error-boundary-fallback"]')).toBeNull();
  });

  test('[Tags-STATE-001] visibility, disabled and loading properties drive DOM and exposed state', async () => {
    // Break this catches: a state property changing the DOM but not the exposed variable (or vice versa), or loading not replacing tags.
    widget.render();
    await mounted();

    await setProperty('visibility', '{{false}}');
    await waitFor(() => expect(wrapper().style.display).toBe('none'));
    expect(widget.exposed().isVisible).toBe(false);
    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(wrapper().style.display).toBe('flex'));
    expect(widget.exposed().isVisible).toBe(true);

    await setProperty('disabledState', '{{true}}');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
    expect(wrapper().style.opacity).toBe('0.5');
    expect(wrapper().style.pointerEvents).toBe('none');
    expect(badge('success').style.cursor).toBe('not-allowed');
    expect(instance()).toHaveClass('disabled');
    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
    expect(wrapper().style.opacity).toBe('1');
    expect(badge('success').style.cursor).toBe('default');
    expect(instance()).not.toHaveClass('disabled');

    await setProperty('loadingState', '{{true}}');
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(screen.getByRole('status', { name: 'Loading tags' })).toBeInTheDocument();
    expect(badges()).toHaveLength(0);
    expect(wrapper()).toHaveAttribute('aria-busy', 'true');
    expect(instance()).toHaveClass('disabled');
    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    expect(screen.queryByRole('status', { name: 'Loading tags' })).toBeNull();
    expect(titles()).toEqual(['success', 'info', 'warning', 'danger']);
    expect(wrapper()).toHaveAttribute('aria-busy', 'false');
  });

  test('[Tags-STATE-001] mounting with all three states set publishes them immediately', async () => {
    // Break this catches: the mount publish reading defaults instead of the configured properties.
    widget.render({
      properties: {
        visibility: binding('{{false}}'),
        disabledState: binding('{{true}}'),
        loadingState: binding('{{true}}'),
      },
    });
    await mounted();

    expect(widget.exposed()).toEqual(expect.objectContaining({ isVisible: false, isDisabled: true, isLoading: true }));
    expect(wrapper().style.display).toBe('none');
    expect(wrapper().style.opacity).toBe('0.5');
    expect(wrapper()).toHaveAttribute('aria-busy', 'true');
  });

  test('[Tags-STATE-002] setVisibility, setDisable and setLoading update DOM and exposed state with boolean coercion', async () => {
    // Break this catches: an action storing the raw argument (1/0) or updating only one of DOM/exposed state.
    widget.render();
    await mounted();

    await widget.act('setDisable', 1);
    expect(widget.exposed().isDisabled).toBe(true);
    await waitFor(() => expect(wrapper().style.opacity).toBe('0.5'));
    await widget.act('setDisable', 0);
    expect(widget.exposed().isDisabled).toBe(false);
    await waitFor(() => expect(wrapper().style.opacity).toBe('1'));

    await widget.act('setLoading', 'yes');
    expect(widget.exposed().isLoading).toBe(true);
    await waitFor(() => expect(screen.getByRole('status', { name: 'Loading tags' })).toBeInTheDocument());
    await widget.act('setLoading', '');
    expect(widget.exposed().isLoading).toBe(false);
    await waitFor(() => expect(badges()).toHaveLength(4));

    await widget.act('setVisibility', 0);
    expect(widget.exposed().isVisible).toBe(false);
    await waitFor(() => expect(wrapper().style.display).toBe('none'));
    await widget.act('setVisibility', 1);
    expect(widget.exposed().isVisible).toBe(true);
    await waitFor(() => expect(wrapper().style.display).toBe('flex'));
  });

  test.each([
    ['setDisable', 'disabledState', true, 'isDisabled', () => wrapper().style.opacity, '0.5', '1'],
    ['setLoading', 'loadingState', true, 'isLoading', () => wrapper().getAttribute('aria-busy'), 'true', 'false'],
    ['setVisibility', 'visibility', false, 'isVisible', () => wrapper().style.display, 'none', 'flex'],
  ])(
    '[Tags-STATE-003] %s survives non-changes and yields to a real %s change',
    async (action, property, actionValue, exposedKey, domState, actionDom, propertyDom) => {
      // Break this catches: an over-broad effect re-applying the property on every render and wiping the action state.
      widget.render();
      await mounted();
      const propertyValue = !actionValue;

      await widget.act(action, actionValue);
      await waitFor(() => expect(domState()).toBe(actionDom));

      await setProperty('overflow', 'scroll');
      await waitFor(() => expect(wrapper().style.flexWrap).toBe('nowrap'));
      expect(widget.exposed()[exposedKey]).toBe(actionValue);
      expect(domState()).toBe(actionDom);

      await setProperty(property, `{{${propertyValue}}}`);
      expect(widget.exposed()[exposedKey]).toBe(actionValue);
      expect(domState()).toBe(actionDom);

      await setProperty(property, `{{${actionValue}}}`);
      await setProperty(property, `{{${propertyValue}}}`);
      await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(propertyValue));
      expect(domState()).toBe(propertyDom);
    }
  );

  test('[Tags-STYLE-001] size, radius, alignment, box shadow and padding reach the rendered inline styles', async () => {
    // Break this catches: a size/alignment branch mapped to the wrong values, or alignment ignored in scroll mode.
    widget.render({ properties: dynamic("[{title:'a', icon:'IconHome', iconVisibility:true}]") });
    await mounted();
    await waitFor(() => expect(icon('a')).not.toBeNull());
    expect(icon('a').style.width).toBe('12px');

    await setProperty('size', 'large', 'styles');
    await waitFor(() => expect(badge('a').style.height).toBe('28px'));
    expect(badge('a').style.fontSize).toBe('14px');
    expect(icon('a').style.width).toBe('16px');

    await setProperty('size', 'medium', 'styles');
    await waitFor(() => expect(badge('a').style.height).toBe('16px'));
    expect(badge('a').style.fontSize).toBe('13px');
    expect(icon('a').style.width).toBe('16px');

    await setProperty('borderRadius', '12', 'styles');
    await waitFor(() => expect(badge('a').style.borderRadius).toBe('12px'));

    for (const [alignment, justify] of [
      ['center', 'center'],
      ['right', 'flex-end'],
      ['left', 'flex-start'],
    ]) {
      await setProperty('overflow', 'wrap');
      await setProperty('alignment', alignment, 'styles');
      await waitFor(() => expect(collection().style.justifyContent).toBe(justify));
      await setProperty('overflow', 'scroll');
      await waitFor(() => expect(collection().parentElement.style.justifyContent).toBe(justify));
    }

    await setProperty('boxShadow', '0px 1px 2px 0px #00000040', 'styles');
    await waitFor(() =>
      expect(screen.getByRole('region', { name: 'Tags widget container' }).style.boxShadow).toBe(
        '0px 1px 2px 0px #00000040'
      )
    );

    expect(instance().style.padding).toBe('2px');
    await setProperty('padding', 'none', 'styles');
    await waitFor(() => expect(instance().style.padding).toBe('0px'));
  });

  test('[Tags-LAYOUT-001] overflow mode switches wrap and scroll inline layout', async () => {
    // Break this catches: swapped overflow branches, or badges keeping wrap-mode shrink/margin in scroll mode.
    widget.render();
    await mounted();

    expect(wrapper().style.flexWrap).toBe('wrap');
    expect(wrapper().style.overflowX).toBe('hidden');
    expect(badge('success').style.flexShrink).toBe('1');
    expect(badge('success').style.margin).toBe('0px 3px 3px 0px');

    await setProperty('overflow', 'scroll');
    await waitFor(() => expect(wrapper().style.flexWrap).toBe('nowrap'));
    expect(wrapper().style.overflowX).toBe('auto');
    expect(wrapper().style.whiteSpace).toBe('nowrap');
    expect(badge('success').style.flexShrink).toBe('0');
    expect(badge('success').style.margin).toBe('0px 3px 0px 0px');
  });

  test.each([
    ['view', 'auto', '36px', 'visible'],
    ['edit', '36px', '', 'auto'],
  ])('[Tags-DYN-001] dynamic height in %s mode', async (currentMode, height, minHeight, overflowY) => {
    // Break this catches: dropping the Viewer-only half of the gate so the Editor canvas loses its authored height.
    widget.render({ properties: { dynamicHeight: binding('{{true}}') }, currentMode });
    await mounted();

    expect(wrapper().style.height).toBe(height);
    expect(wrapper().style.minHeight).toBe(minHeight);
    expect(wrapper().style.overflowY).toBe(overflowY);
  });

  test('[Tags-VAR-001] runtime publishes the documented exposed surface despite the empty registration', async () => {
    // Break this catches: a removed or renamed exposed variable/action that apps bind to.
    widget.render();
    await mounted();

    const exposed = widget.exposed();
    expect(Object.keys(exposed).sort()).toEqual(
      ['id', 'isDisabled', 'isLoading', 'isVisible', 'setDisable', 'setLoading', 'setVisibility', 'tags'].sort()
    );
    expect(exposed.id).toBe(ID);
    expect(Array.isArray(exposed.tags)).toBe(true);
    for (const key of ['isDisabled', 'isLoading', 'isVisible']) expect(typeof exposed[key]).toBe('boolean');
  });

  test('[Tags-A11Y-001] accessible names describe the container, counts, tags and loading', async () => {
    // Break this catches: stale counts in the live region, or icons announced alongside the title.
    widget.render();
    await mounted();

    expect(screen.getByRole('region', { name: 'Tags widget container' })).toBeInTheDocument();
    const display = screen.getByRole('group', { name: 'Tags display: 4 tags' });
    expect(display).toHaveAttribute('aria-live', 'polite');
    expect(within(display).getByRole('group', { name: 'Tag collection with 4 items' })).toBeInTheDocument();
    for (const title of ['success', 'info', 'warning', 'danger']) {
      expect(screen.getByLabelText(`${title} with icon`)).toBe(badge(title));
      await waitFor(() => expect(icon(title)).toHaveAttribute('aria-hidden', 'true'));
    }

    await widget.act('setLoading', true);
    await waitFor(() => expect(screen.getByRole('status', { name: 'Loading tags' })).toBeInTheDocument());
    expect(display).toHaveAttribute('aria-busy', 'true');
  });

  test('[Tags-ISO-001] two Tags instances stay independent', async () => {
    // Break this catches: shared module state or a mis-scoped exposed write leaking between instances.
    const second = componentDefinition('t2', 'tags2', 'Tags', {
      ...SHIPPED.properties,
      ...dynamic("[{title:'other'}]"),
    });
    second.component.definition.styles = { ...SHIPPED.styles };
    widget.render({
      properties: dynamic("[{title:'mine'}]"),
      extraComponents: { t2: second },
      also: [{ id: 't2', componentType: 'Tags', widgetWidth: 300 }],
    });
    await mounted();
    await mounted('t2');
    expect(titles()).toEqual(['mine']);
    expect(titles('tags2')).toEqual(['other']);

    await setProperty('data', "{{[{title:'changed'}]}}");
    await waitFor(() => expect(titles()).toEqual(['changed']));
    expect(titles('tags2')).toEqual(['other']);
    expect(widget.exposed('t2').tags).toEqual(['other']);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(wrapper().style.display).toBe('none'));
    expect(wrapper('tags2').style.display).toBe('flex');
    expect(widget.exposed('t2').isVisible).toBe(true);
  });

  test('[Tags-SEC-001] authored titles and colors cannot inject markup', async () => {
    // Break this catches: switching the title to dangerouslySetInnerHTML or rendering colors as markup.
    widget.render({
      properties: dynamic(
        "[{title:'<img src=x onerror=alert(1)>', color:'<script>alert(1)</script>', textColor:'red;background:url(javascript:alert(1))'}]"
      ),
    });
    await mounted();

    expect(titles()).toEqual(['<img src=x onerror=alert(1)>']);
    expect(instance().querySelector('img')).toBeNull();
    expect(instance().querySelector('script')).toBeNull();
    expect(badges()[0].children).toHaveLength(0);
  });
});
