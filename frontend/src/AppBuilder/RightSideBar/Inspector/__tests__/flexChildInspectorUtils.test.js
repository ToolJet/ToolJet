jest.mock('../Components/FlexChildLayoutPanel', () => ({
  FlexChildLayoutPanel: () => null,
}));

import { injectFlexChildWidthBeforeAdditionalActions } from '../Components/FlexContainer/flexChildInspectorUtils';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';

describe('injectFlexChildWidthBeforeAdditionalActions', () => {
  it('inserts the flex child item before Additional Actions using its language-agnostic id', () => {
    const flexChildItem = { id: 'flex-child-width', title: 'Width' };
    const items = [
      { id: 'general', title: 'General' },
      { id: ADDITIONAL_ACTIONS_ACCORDION_ID, title: 'Acciones adicionales' },
    ];

    expect(injectFlexChildWidthBeforeAdditionalActions(items, flexChildItem)).toEqual([
      items[0],
      flexChildItem,
      items[1],
    ]);
  });

  it('does not identify Additional Actions by its display title', () => {
    const items = [{ title: 'Additional Actions' }];

    expect(injectFlexChildWidthBeforeAdditionalActions(items, { title: 'Width' })).toBe(items);
  });
});
