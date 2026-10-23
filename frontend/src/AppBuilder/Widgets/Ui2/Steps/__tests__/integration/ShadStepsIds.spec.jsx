/**
 * UI 2.0 Steps gives every step an id of its own (release audit 52): a repeated id repaired once could land on another
 * step's authored id, and a click then selected the wrong step. Authored ids keep their value. Titles carry
 * [ShadSteps-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { normalizeSteps } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';

const NAMES = ['Alpha', 'Beta', 'Gamma'];
const steps = (ids) => ids.map((id, i) => ({ id, name: NAMES[i] }));
const ids = (list) => normalizeSteps(steps(list)).map((s) => s.id);
const unique = (list) => expect(new Set(list.map(String)).size).toBe(list.length);

describe('UI 2.0 Steps ids', () => {
  test('[ShadSteps-ID-001] are unique when a repaired id would land on another id, and authored ids are kept', () => {
    unique(ids(['a', 'a', 'a']));
    unique(ids(['a-3', 'a', 'a']));
    unique(ids(['3-3', 3, undefined]));
    expect(ids(['a-3', 'a', 'a']).slice(0, 2)).toEqual(['a-3', 'a']);
    expect(ids(['x', 7, undefined])).toEqual(['x', 7, 3]);
  });

  describe('in the widget', () => {
    const widget = createWidgetHarness({
      componentType: 'ShadSteps',
      handle: 'steps1',
      id: 'steps1',
      widgetWidth: 640,
      widgetHeight: 120,
    });
    beforeEach(() => widget.setup());
    afterEach(widget.teardown);

    test('[ShadSteps-ID-002] a click on a step with a repeated id selects that step', async () => {
      widget.render({
        currentMode: 'view',
        properties: { steps: binding(`{{${JSON.stringify(steps(['a-3', 'a', 'a']))}}}`), currentStep: binding('a') },
      });
      await act(async () => fireEvent.click(await screen.findByRole('button', { name: /Gamma/ })));
      expect(widget.exposed().currentStepIndex).toBe(2);
      expect(screen.getByRole('button', { name: /Gamma/ })).toHaveAttribute('aria-current', 'step');
    });
  });
});
