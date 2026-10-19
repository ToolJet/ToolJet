// Release audit 2026-10-18 (Codex fixtures reviewDialogRenameTarget and reviewSplitRenameTargets): every retired name
// must map to a name the widget has. The common `disable` -> `setDisable` also applied to the Dialog, which has only
// setDisableTrigger and setDisableModal, so a saved `disable` was rewritten to an action that does not exist. The
// Dialog was ModalV2 in the pack's look and never had `disable` (the alias came with withControlState, which it did
// not use), so it keeps no rename for it.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { renamesFor } from '@/AppBuilder/Widgets/Ui2/legacyNames';
import { contractOf } from '@/AppBuilder/Widgets/Ui2/__tests__/compat/contract';
import { act } from '@testing-library/react';

test.each(shadcnConfigs.map((c) => [c.name, c]))('%s: every rename target is a live name', (_, config) => {
  const contract = contractOf(config);
  const renames = renamesFor(config.name);
  const missing = ['events', 'actions', 'exposed', 'properties'].flatMap((kind) => {
    const live = Array.isArray(contract[kind]) ? contract[kind] : Object.keys(contract[kind]);
    return Object.entries(renames[kind])
      .filter(([, target]) => !live.includes(target.split('.')[0]))
      .map(([from, target]) => `${kind}: ${from} -> ${target}`);
  });
  expect(missing).toEqual([]);
});

describe('ShadDialog', () => {
  const w = createWidgetHarness({ componentType: 'ShadDialog', id: 'dialog1', handle: 'dialog1' });
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  it('runs every action a retired name maps to, and keeps no rename for `disable`', async () => {
    await act(async () => w.render({ currentMode: 'view' }));
    const { actions } = renamesFor('ShadDialog');
    expect(actions.disable).toBeUndefined();
    for (const target of Object.values(actions)) expect(typeof w.exposed()[target]).toBe('function');
    expect(typeof w.exposed().setDisableTrigger).toBe('function');
    expect(typeof w.exposed().setDisableModal).toBe('function');
  });
});
