/**
 * Widgets routed to the default inspector only get an "Additional Actions" accordion when
 * they are listed in SHOW_ADDITIONAL_ACTIONS (DefaultComponent.jsx). A widget whose
 * Visibility / Collapse when hidden moved into Additional Actions but is missing from that
 * list would show no toggle at all.
 */
import { baseComponentProperties } from '../Components/DefaultComponent';
import { componentTypes } from '@/AppBuilder/WidgetManager/componentTypes';

const noop = () => {};
// The inspector receives the merged meta (widget config + universal props), as the app does.
const meta = (component) => componentTypes.find((c) => c.component === component);

const accordionTitles = (config) => {
  const additionalActions = Object.keys(config.properties).filter(
    (key) => config.properties[key].section === 'additionalActions'
  );
  const properties = Object.keys(config.properties).filter((key) => !additionalActions.includes(key));
  const component = { component: { ...config, name: 'widget1' } };
  return baseComponentProperties(
    properties,
    Object.keys(config.events),
    component,
    config,
    noop,
    noop,
    [],
    {},
    noop,
    [],
    {},
    [],
    false,
    [],
    additionalActions,
    'widget1'
  ).map((item) => item.title);
};

describe.each([
  'Calendar',
  'QrScanner',
  'Spinner',
  'BoundedBox',
  'CodeEditor',
  'Kanban',
  'Map',
  'PDF',
  'RichTextEditor',
  'SvgImage',
])('%s default inspector', (component) => {
  test('shows the Additional Actions accordion', () => {
    expect(accordionTitles(meta(component))).toContain('Additional Actions');
  });

  test('hides the General section, since its tooltip lives in Additional Actions', () => {
    expect(accordionTitles(meta(component))).not.toContain('General');
  });
});
