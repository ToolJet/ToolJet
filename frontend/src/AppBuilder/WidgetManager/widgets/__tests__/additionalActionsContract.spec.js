/**
 * Every non-legacy widget keeps Visibility (and, where it has them, Disable / Loading) in
 * Properties → Additional Actions, offers "Collapse when hidden" there, and pairs each state
 * prop with its CSA (setVisibility / setDisable / setLoading) and exposed variable
 * (isVisible / isDisabled / isLoading). The frontend and server widget configs are
 * independently maintained copies, so both are checked.
 */
import * as frontendWidgetExports from '../index';
// eslint-disable-next-line import/no-relative-packages
import serverWidgetMap from '../../../../../../server/src/modules/apps/services/widget-config/index';

const STATE_PROPS = {
  visibility: { action: 'setVisibility', exposed: 'isVisible' },
  disabledState: { action: 'setDisable', exposed: 'isDisabled' },
  loadingState: { action: 'setLoading', exposed: 'isLoading' },
};

// component → state props it must expose in Additional Actions
const CONTRACT = {
  AudioRecorder: ['visibility', 'disabledState', 'loadingState'],
  Camera: ['visibility', 'disabledState'],
  CircularProgressBar: ['visibility', 'loadingState'],
  FileButton: ['visibility', 'disabledState', 'loadingState'],
  FileInput: ['visibility', 'disabledState', 'loadingState'],
  Icon: ['visibility', 'disabledState', 'loadingState'],
  Pagination: ['visibility', 'disabledState', 'loadingState'],
  PopoverMenu: ['visibility', 'disabledState', 'loadingState'],
};

const asList = (exports) => Object.values(exports).filter((w) => w && typeof w === 'object' && w.component);
const frontendWidgets = asList(frontendWidgetExports);
const serverWidgets = asList(serverWidgetMap);
const findConfig = (widgets, component) => widgets.find((w) => w.component === component);

describe.each([
  ['frontend', frontendWidgets],
  ['server', serverWidgets],
])('%s widget configs: Additional Actions contract', (_side, widgets) => {
  describe.each(Object.entries(CONTRACT))('%s', (component, stateProps) => {
    const config = () => findConfig(widgets, component);

    test('offers Collapse when hidden in Additional Actions, defaulting to false', () => {
      expect(config().properties.collapseWhenHidden).toMatchObject({
        type: 'toggle',
        displayName: 'Collapse when hidden',
        section: 'additionalActions',
        validation: { schema: { type: 'boolean' }, defaultValue: false },
      });
      expect(config().definition.properties.collapseWhenHidden).toEqual({ value: '{{false}}' });
    });

    test.each(stateProps)('%s lives in Additional Actions with its CSA and exposed variable', (prop) => {
      const { action, exposed } = STATE_PROPS[prop];
      expect(config().properties[prop]).toMatchObject({ type: 'toggle', section: 'additionalActions' });
      expect(config().definition.properties[prop]).toBeDefined();
      expect(config().styles?.[prop]).toBeUndefined();
      expect(config().definition.styles?.[prop]).toBeUndefined();
      expect(config().actions.map((a) => a.handle)).toContain(action);
      expect(config().exposedVariables).toHaveProperty(exposed);
    });
  });
});
