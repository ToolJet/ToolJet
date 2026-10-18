/**
 * UI 2.0 widgets publish only what changed. Inside an action's exposed-value batch the store writes every key it is
 * given and updates the dependencies of each, so a query that runs on a dependency change re-ran when a click
 * re-published unchanged keys (isVisible, isLoading, isDisabled, label). Found by the independent review of the
 * release-audit fixes. Titles carry [UI2-PUB-NNN] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'ShadCheckbox',
  handle: 'checkbox1',
  id: 'chk1',
  widgetHeight: 48,
  widgetWidth: 320,
  defaultProperties: { label: binding('I agree to the terms') },
});

describe('UI 2.0 publishing', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[UI2-PUB-001] a click publishes the changed value, not the unchanged keys around it', async () => {
    widget.render({ currentMode: 'view' });
    const box = await screen.findByRole('checkbox');
    await waitFor(() => expect(widget.exposed().value).toBe(false));

    const paths = [];
    const original = useStore.getState().updateDependencyValues;
    useStore.setState({
      updateDependencyValues: (path, ...rest) => {
        paths.push(path);
        return original(path, ...rest);
      },
    });
    try {
      await act(async () => fireEvent.click(box));
      await waitFor(() => expect(widget.exposed().value).toBe(true));
    } finally {
      useStore.setState({ updateDependencyValues: original });
    }

    const keys = paths
      .filter((p) => typeof p === 'string' && p.startsWith('components.chk1.'))
      .map((p) => p.slice('components.chk1.'.length));
    expect(keys).toContain('value');
    expect(keys.filter((k) => ['isVisible', 'isLoading', 'isDisabled', 'label'].includes(k))).toEqual([]);
  });

  test('[UI2-PUB-002] a value set and then set back inside one action still lands on the last value', async () => {
    widget.render({ currentMode: 'view' });
    await waitFor(() => expect(widget.exposed().value).toBe(false));

    await widget.act('setValue', true);
    await act(async () => {
      await widget.exposed().setValue(false);
      await widget.exposed().setValue(true);
      await widget.exposed().setValue(false);
    });

    expect(widget.exposed().value).toBe(false);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
