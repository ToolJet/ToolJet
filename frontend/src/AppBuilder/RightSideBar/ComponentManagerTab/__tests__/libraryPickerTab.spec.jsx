import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryPicker } from '../LibraryPicker';
import { libraryChoices } from '../componentLibrary';

// The Components tab's label is this picker (ComponentsManagerTab). In a browser its menu opens on pointer down and then
// blocks clicks outside it, so the tab button under the label never gets the click: from Modules, clicking the label
// left the panel on Modules. The tab switches itself through onOpen instead. jsdom does no hit-testing, so the blocked
// click itself is browser-only; this pins the hook the tab relies on.
const choices = libraryChoices([{ pack: 'mui', displayName: 'Material UI' }], []);
const trigger = () => document.querySelector('[data-cy="component-library-picker"]');

describe('the library picker on the Components tab', () => {
  it('tells the tab when its menu opens, and not when it closes', async () => {
    const user = userEvent.setup();
    const onOpen = jest.fn();
    render(<LibraryPicker value="pack:mui" choices={choices} onChange={() => {}} onOpen={onOpen} />);

    await user.click(trigger());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledTimes(1);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
