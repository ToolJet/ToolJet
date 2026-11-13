import React from 'react';
import { render } from '@testing-library/react';

import { Icon } from '@/AppBuilder/CodeBuilder/Elements/Icon';

const byCy = (cy) => document.querySelector(`[data-cy="${cy}"]`);

describe('icon field', () => {
  it('hides the show/hide eye only when the field meta says visibility: false', () => {
    // Break this catches: a library icon field showing an eye that writes an iconVisibility style nobody reads,
    // or native icon fields (no `visibility` key) losing their eye.
    const { unmount } = render(<Icon value="IconBell" onChange={jest.fn()} meta={{ visibility: false }} />);
    expect(byCy('icon-visibility-button')).toBeNull();
    unmount();

    render(<Icon value="IconBell" onChange={jest.fn()} meta={{ displayName: 'Icon' }} />);
    expect(byCy('icon-visibility-button')).toBeInTheDocument();
  });
});
