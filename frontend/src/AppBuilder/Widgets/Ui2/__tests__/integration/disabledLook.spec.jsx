/**
 * A disabled UI 2.0 widget looks disabled, the way a native widget does: RenderWidget dims it to half opacity once
 * (.ui2-disabled; a native widget gets .disabled). Before, a Stat, a Hero and Tabs drew exactly as when enabled, and an
 * Input or Select dimmed only its box. Parts that dim themselves when disabled keep full opacity inside the dimmed
 * wrapper, so nothing reads at a quarter opacity. Loading is its own state and is not dimmed.
 * Real store, real RenderWidget, real widgets; the stylesheet rules are read from the source (jsdom applies no CSS).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import fs from 'fs';
import path from 'path';
import { act } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const harness = (componentType, height = 120) =>
  createWidgetHarness({
    componentType,
    handle: `${componentType.toLowerCase()}1`,
    id: 'w1',
    widgetHeight: height,
    capabilities: { dnd: true },
  });
const widgets = {
  field: harness('ShadInput', 70),
  display: harness('ShadStat', 140),
  hero: harness('ShadHero', 240),
  container: harness('ShadTabs', 240),
};
const wrapper = () => document.querySelector('.canvas-component');
const DISABLED = { disabledState: binding('{{true}}') };

describe('A disabled UI 2.0 widget looks disabled', () => {
  beforeEach(() => Promise.all(Object.values(widgets).map((w) => w.setup())));
  afterEach(() => Object.values(widgets).forEach((w) => w.teardown()));

  test.each(Object.keys(widgets))('[Disabled-001] a disabled %s is dimmed once, by its wrapper', (kind) => {
    widgets[kind].render({ currentMode: 'view', properties: DISABLED });
    expect(wrapper()).toHaveClass('ui2-disabled');
    // Not the native wrapper class: its pointer-events: none would also stop tooltips.
    expect(wrapper()).not.toHaveClass('disabled');
  });

  test.each(Object.keys(widgets))('[Disabled-002] an enabled %s is not dimmed', (kind) => {
    widgets[kind].render({ currentMode: 'view' });
    expect(wrapper()).not.toHaveClass('ui2-disabled');
  });

  test('[Disabled-003] loading is not dimmed, disabled or not', () => {
    widgets.display.render({ currentMode: 'view', properties: { ...DISABLED, loadingState: binding('{{true}}') } });
    expect(wrapper()).not.toHaveClass('ui2-disabled');
  });

  test('[Disabled-004] the setDisable action dims it too, in the editor as in the viewer', () => {
    widgets.field.render({ currentMode: 'edit' });
    expect(wrapper()).not.toHaveClass('ui2-disabled');
    act(() => widgets.field.setExposedValue('w1', 'isDisabled', true));
    expect(wrapper()).toHaveClass('ui2-disabled');
  });

  test('[Disabled-005] the field keeps its own disabled control, which the wrapper rules keep at full opacity', () => {
    widgets.field.render({ currentMode: 'view', properties: DISABLED });
    const input = document.querySelector('.tj-shadcn input');
    expect(input).toBeDisabled();
    expect(input.className).toMatch(/disabled:tw-opacity-50/);

    const scss = fs.readFileSync(path.resolve(__dirname, '../../_shared/styles/shadcn.scss'), 'utf8');
    const rule = scss.slice(scss.indexOf('.ui2-disabled .tj-shadcn {'));
    expect(scss).toMatch(/\.ui2-disabled \{\s*opacity: 0\.5;/);
    for (const selector of [':disabled', "[aria-disabled='true']", '.tw-peer:disabled ~ *', '.sc-self-dim']) {
      expect(rule).toContain(selector);
    }
    expect(rule).toMatch(/opacity: 1;/);
  });

  test('[Disabled-006] parts that dim themselves when disabled are marked, so they are not dimmed twice', () => {
    const ui2 = path.resolve(__dirname, '../..');
    for (const file of [
      '_inputs/inputParts.tsx',
      'TagsInput/TagsInput.tsx',
      'OtpInput/OtpInput.tsx',
      'Multiselect/Multiselect.tsx',
      'Link/Link.tsx',
      'Icon/Icon.tsx',
      'Calendar/Calendar.tsx',
      'FileUpload/FileUpload.tsx',
      'Chat/Chat.tsx',
    ]) {
      const source = fs.readFileSync(path.join(ui2, file), 'utf8');
      // Every opacity class switched on by the widget's disabled flag carries the marker (not a per-item one, such as a
      // calendar day's modifiers.disabled).
      const own =
        source.match(/(?<![.\w])(disabled|p\.disabledState|locked|full\)) && '[^']*tw-opacity-\d+[^']*'/g) || [];
      expect(own.length).toBeGreaterThan(0);
      own.forEach((classes) => expect(`${file}: ${classes}`).toContain('sc-self-dim'));
    }
  });
});
