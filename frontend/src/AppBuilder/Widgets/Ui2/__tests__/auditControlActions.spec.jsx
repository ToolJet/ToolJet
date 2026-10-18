// Release audit round 2 (Codex fixture reviewSplitCommonControls, kept as written): setLoading and setDisable (and the
// Dialog's setVisibility, setDisableTrigger and setDisableModal) left the old value readable on the next line of a
// query, though every settled read was right. The shared control state only scheduled React state; owned actions
// (withControlState, withOwnedActions) now run every published action through runNow.
import { createWidgetHarness, measureChartsAt } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { act } from '@testing-library/react';
measureChartsAt(640, 420);
const controls = [
  ['setVisibility', 'isVisible', false, true],
  ['setLoading', 'isLoading', true, false],
  ['setDisable', 'isDisabled', true, false],
  ['setDisableTrigger', 'isDisabledTrigger', true, false],
  ['setDisableModal', 'isDisabledModal', true, false],
];
const harnesses = Object.fromEntries(
  shadcnConfigs.map((c) => [
    c.name,
    createWidgetHarness({
      componentType: c.name,
      handle: 'widget1',
      id: 'w1',
      widgetHeight: 420,
      widgetWidth: 640,
      preload: [c.name],
      capabilities: { dnd: true },
    }),
  ])
);
const cases = shadcnConfigs.flatMap((c) =>
  controls.filter(([name]) => c.actions.some((a) => a.handle === name)).map((control) => [c.name, ...control])
);
test.each(cases)('%s.%s publishes and restores state', async (type, action, key, first, second) => {
  const widget = harnesses[type];
  await widget.setup();
  try {
    await act(async () => {
      widget.render({ currentMode: 'view' });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const { after, settled } = await widget.runQuery([
      [action, first],
      [action, second],
    ]);
    expect({ first: after[0][key], second: after[1][key], settled: settled[key] }).toEqual({
      first,
      second,
      settled: second,
    });
  } finally {
    widget.teardown();
  }
});
test.each(cases)('%s.%s settles between separate actions', async (type, action, key, first, second) => {
  const widget = harnesses[type];
  await widget.setup();
  try {
    await act(async () => {
      widget.render({ currentMode: 'view' });
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await widget.act(action, first);
    expect(widget.exposed()[key]).toBe(first);
    await widget.act(action, second);
    expect(widget.exposed()[key]).toBe(second);
  } finally {
    widget.teardown();
  }
});
