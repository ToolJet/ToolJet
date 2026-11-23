import React from 'react';
import { render } from '@testing-library/react';
import Logs from '../Logs';

jest.mock('@/_ui/JSONTreeViewer', () => () => null);
jest.mock('@/_ui/Icon/SolidIcons', () => () => null);
jest.mock('@/AppBuilder/_stores/store', () => ({ __esModule: true, default: { getState: () => ({}) } }));

// The sizes and colours live in left-sidebar.scss (.debugger-content), which jsdom does not load: these tests pin the
// hooks that stylesheet targets. The values themselves were checked in the browser.
const customLog = {
  type: 'Custom Log',
  key: '[Code mode] Blocked request',
  errorTarget: 'Event Errors with page',
  description: "Code mode apps can't load a network request.",
  timestamp: Date.now(),
};
const queryError = {
  type: 'query',
  key: 'getUsers',
  errorTarget: 'Queries',
  description: 'Request timed out',
  timestamp: Date.now(),
};

describe('Debugger log styling hooks', () => {
  it("gives a Custom Log's message the regular message style plus the muted custom one, not a bold weight", () => {
    const { getByText } = render(<Logs logProps={customLog} idx={0} />);
    const message = getByText("Code mode apps can't load a network request.");
    expect(message).toHaveClass('debugger-log-message', 'debugger-log-message--custom');
    expect(message).not.toHaveClass('font-weight-500');
  });

  it('gives any other log message the regular message style, keeping its error colour, not a bold weight', () => {
    const { getByText } = render(<Logs logProps={queryError} idx={0} />);
    const message = getByText('Query failed: Request timed out');
    expect(message).toHaveClass('debugger-log-message', 'text-tomato-9');
    expect(message).not.toHaveClass('debugger-log-message--custom', 'font-weight-500');
  });

  it('keeps the title on the class that spaces it from the tags and the message', () => {
    const { container } = render(<Logs logProps={queryError} idx={0} />);
    expect(container.querySelector('.debugger-error-title')).toHaveTextContent('getUsers');
  });
});
