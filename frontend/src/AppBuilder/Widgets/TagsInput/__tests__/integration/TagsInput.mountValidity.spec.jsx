/**
 * TagsInput — `isValid` right after mount matches the selection the widget starts with.
 *
 * The defaults effects select the default tags and expose their validity; the mount effect then exposed `isValid` from
 * the first render, before anything was selected. A mandatory field with default tags exposed false.
 */
import { binding, drain, createWidgetHarness } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { tagsInputConfig } from '@/AppBuilder/WidgetManager/widgets/TagsInput';

const { definition } = tagsInputConfig;
const harness = createWidgetHarness({
  componentType: 'TagsInput',
  handle: 'tagsinput1',
  id: 'tags1',
  defaultProperties: { ...definition.properties, dynamicHeight: binding('{{false}}') },
  defaultStyles: definition.styles,
  defaultValidation: definition.validation,
});
const MANDATORY = { mandatory: binding(true) };

describe('TagsInput: isValid on mount', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('a mandatory field with default tags is valid', async () => {
    harness.render({ properties: { values: binding("{{['newport']}}") }, validation: MANDATORY });
    await drain();

    expect(harness.exposed().values).toEqual(['newport']);
    expect(harness.exposed().isValid).toBe(true);
  });

  test('a mandatory field with no tags is invalid, as before', async () => {
    harness.render({ properties: { values: binding('{{[]}}') }, validation: MANDATORY });
    await drain();

    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);
  });

  test('advanced mode: a mandatory field with a default tag is valid', async () => {
    harness.render({
      properties: {
        advanced: binding('{{true}}'),
        schema: binding("{{[{label: 'Newport', value: 'newport', visible: true, default: true, disable: false}]}}"),
      },
      validation: MANDATORY,
    });
    await drain();

    expect(harness.exposed().values).toEqual(['newport']);
    expect(harness.exposed().isValid).toBe(true);
  });
});
