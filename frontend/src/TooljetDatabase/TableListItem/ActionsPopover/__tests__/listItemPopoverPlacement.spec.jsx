// Tables near the bottom of the sidebar must not have their ⋮ menu cut off by the window: the
// overlay has to be allowed to flip upward. jsdom has no layout, so assert the Popper flip is
// enabled on the overlay rather than measuring positions (covered by the Cypress/manual path).
import React from 'react';
import { render } from '@/test/test-utils';
import { ListItemPopover } from '../index';

const mockOverlayTrigger = jest.fn(({ children }) => children);
jest.mock('react-bootstrap/OverlayTrigger', () => ({
  __esModule: true,
  default: (props) => mockOverlayTrigger(props),
}));

describe('ListItemPopover placement', () => {
  it('enables flip so the menu opens upward when there is no room below', () => {
    render(<ListItemPopover canEditTjdb canEditSchema onMenuToggle={() => {}} />);

    const props = mockOverlayTrigger.mock.calls[0][0];
    expect(props.placement).toBe('bottom');
    expect(props.flip).toBe(true);
  });
});
