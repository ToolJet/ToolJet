import { pluginIconFile } from '../pluginIcon';

const ICON = 'PHN2Zz5saWdodDwvc3ZnPg==';
const DARK_ICON = 'PHN2Zz5kYXJrPC9zdmc+';

describe('pluginIconFile', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('uses the dark icon in dark mode when the plugin ships one', () => {
    const plugin = { iconFile: { data: ICON }, darkIconFile: { data: DARK_ICON } };

    expect(pluginIconFile(plugin, true)).toBe(DARK_ICON);
    expect(pluginIconFile(plugin, false)).toBe(ICON);
  });

  it('keeps the icon in dark mode for a plugin with no dark icon', () => {
    expect(pluginIconFile({ iconFile: { data: ICON }, darkIconFile: null }, true)).toBe(ICON);
    expect(pluginIconFile({ iconFile: { data: ICON } }, true)).toBe(ICON);
  });

  it('reads the snake_case keys a data query carries', () => {
    const plugin = { icon_file: { data: ICON }, dark_icon_file: { data: DARK_ICON } };

    expect(pluginIconFile(plugin, true)).toBe(DARK_ICON);
    expect(pluginIconFile(plugin, false)).toBe(ICON);
  });

  it('follows the saved theme when none is passed', () => {
    const plugin = { iconFile: { data: ICON }, darkIconFile: { data: DARK_ICON } };

    expect(pluginIconFile(plugin)).toBe(ICON);
    localStorage.setItem('darkMode', 'true');
    expect(pluginIconFile(plugin)).toBe(DARK_ICON);
  });

  it('has nothing for something that is not a marketplace plugin', () => {
    expect(pluginIconFile(undefined, true)).toBeUndefined();
    expect(pluginIconFile({ kind: 'postgresql' }, true)).toBeUndefined();
  });
});
