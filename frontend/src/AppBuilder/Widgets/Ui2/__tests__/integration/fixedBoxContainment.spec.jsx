/**
 * The fixed-box policy (Codex round 7, R7-02). A UI 2.0 widget with a Dynamic height setting, drawn in a fixed box (the
 * editor, or Dynamic height off), keeps its content inside the box: its root fills the box and the content scrolls
 * inside it. A Calendar, Card grid, Carousel, File upload, Key-value list, Questionnaire, Schedule, Timeline and Tags
 * drew at their content's height and painted over the widgets below them (a 140px Questionnaire drew 447px).
 *
 * Every widget whose config has a Dynamic height setting is drawn here with it off, in a 300x120 box. jsdom has no
 * layout, so this checks the rules that contain it: the root fills the box (height 100%, min-height 0) and either scrolls
 * itself or clips and scrolls in a part of its own. The drawn result is measured in a browser (see the report).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { CONFIGS, TYPES } from '@/AppBuilder/Widgets/Ui2/__tests__/packWidgets';

// The Dialog's Dynamic height is its modal's (ModalV2 fits the modal's body to it); its box on the canvas holds only
// the trigger button.
const WITH_DYNAMIC_HEIGHT = TYPES.filter((type) => CONFIGS[type].properties?.dynamicHeight && type !== 'ShadDialog');

// The root is as tall as the box: height 100%, or the box's own height in px (the Tabs draws its strip and panes in it).
const fills = (el) =>
  el.classList.contains('tw-h-full') || el.style.height === '100%' || parseFloat(el.style.height) <= 120;
const scrolls = (el) =>
  el.classList.contains('tw-overflow-y-auto') ||
  ['auto', 'scroll'].includes(el.style.overflowY) ||
  /(^|\s)(auto|scroll)$/.test(el.style.overflow);
const clips = (el) => el.classList.contains('tw-overflow-hidden') || el.style.overflow === 'hidden';

describe('a UI 2.0 widget in a fixed box keeps its content inside it', () => {
  it('covers every widget with a Dynamic height setting', () => {
    expect(WITH_DYNAMIC_HEIGHT.length).toBeGreaterThanOrEqual(30);
    expect(WITH_DYNAMIC_HEIGHT).toEqual(expect.arrayContaining(['ShadCalendar', 'ShadCardGrid', 'ShadTags']));
  });

  test.each(WITH_DYNAMIC_HEIGHT)('%s', async (type) => {
    const widget = createWidgetHarness({
      componentType: type,
      id: 'w1',
      handle: 'w1',
      capabilities: { dnd: true },
      widgetWidth: 300,
      widgetHeight: 120,
    });
    await widget.setup();
    try {
      const { container } = widget.render({
        currentMode: 'view',
        properties: { dynamicHeight: binding('{{false}}') },
      });
      const root = container.querySelector('.canvas-component > *');
      expect(root).not.toBeNull();
      expect(`${type} root fills its box: ${fills(root)}`).toBe(`${type} root fills its box: true`);
      // A part that scrolls may mount a commit later (a Tabs pane's canvas).
      // The Tabs clips at its box and each pane's canvas scrolls (overflow 'hidden auto', Tabs.tsx); the panes' canvases
      // need the canvas's drag-and-drop layer and width, which this harness does not mount for them.
      const contained = () =>
        scrolls(root) || (clips(root) && (type === 'ShadTabs' || [...root.querySelectorAll('*')].some(scrolls)));
      await waitFor(() =>
        expect(`${type} contains its content: ${contained()}`).toBe(`${type} contains its content: true`)
      );
    } finally {
      widget.teardown();
    }
  });
});
