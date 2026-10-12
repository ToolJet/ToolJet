/**
 * A widget's tooltip inside a parent that has none (a List view row, a Kanban card, a Container).
 *
 * Every widget on the canvas is wrapped in WidgetTooltip, tooltip or not. An opened Radix Tooltip, even one with no
 * content, closes every other open tooltip, and a hover over a child reaches the parent's trigger too. When the
 * parent's open timer fired after the child's, the child's tooltip showed for a moment and closed: tooltips on
 * buttons in List view rows and Kanban cards never stayed up (shadcn pack and native Listview alike).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WidgetTooltip from '../WidgetTooltip';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('WidgetTooltip inside a parent widget without a tooltip', () => {
  test('the child tooltip opens on hover and stays open', async () => {
    const user = userEvent.setup();
    render(
      // The parent's open timer fires after the child's, as it did in the browser.
      <WidgetTooltip content="" show={false} delayDuration={700}>
        <div data-testid="row">
          <WidgetTooltip content="Approve this request" show>
            <button type="button">Approve</button>
          </WidgetTooltip>
        </div>
      </WidgetTooltip>
    );

    await user.hover(screen.getByRole('button', { name: 'Approve' }));
    // Past both open delays (500ms, 700ms) and the close animation a late parent open would start.
    await wait(1100);
    expect(screen.getAllByText('Approve this request').length).toBeGreaterThan(0);
  });

  test('a parent with a tooltip still shows it when hovered directly', async () => {
    const user = userEvent.setup();
    render(
      <WidgetTooltip content="Pending requests" show>
        <div data-testid="row">row</div>
      </WidgetTooltip>
    );

    await user.hover(screen.getByTestId('row'));
    await wait(700);
    expect(screen.getAllByText('Pending requests').length).toBeGreaterThan(0);
  });
});
