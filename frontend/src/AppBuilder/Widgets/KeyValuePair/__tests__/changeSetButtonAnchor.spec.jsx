import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChangeSetButtonAnchor } from '../KeyValuePair';

// The icon-only Cancel / Save buttons must show their tooltip on keyboard focus, not only on hover.
test('[KeyValuePair-BTN-001] the icon button itself anchors its tooltip so keyboard focus shows it', () => {
  // Break this catches: anchoring the tooltip only on the wrapper span, which never receives focus, so a keyboard
  // user tabbing to the ✕ / ✓ icons gets no tooltip.
  render(
    <ChangeSetButtonAnchor label="Cancel" tooltipId="kv-cta-tooltip">
      <button type="button">x</button>
    </ChangeSetButtonAnchor>
  );

  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('data-tooltip-id', 'kv-cta-tooltip');
  expect(button).toHaveAttribute('data-tooltip-content', 'Cancel');
});
