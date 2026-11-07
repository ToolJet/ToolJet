import { logMessage } from '../Logs';

jest.mock('@/_ui/JSONTreeViewer', () => () => null);
jest.mock('@/_ui/Icon/SolidIcons', () => () => null);
jest.mock('@/AppBuilder/_stores/store', () => ({ __esModule: true, default: { getState: () => ({}) } }));

describe('Debugger log message (QA-43)', () => {
  it('shows a version log as its own sentence, without "Invalid property detected" or a double full stop', () => {
    expect(
      logMessage({
        type: 'component',
        errorTarget: 'Version',
        key: 'Promote Failed',
        message: "This version can't be promoted yet. It has not been checked yet.",
      })
    ).toBe("This version can't be promoted yet. It has not been checked yet.");
    expect(logMessage({ type: 'component', errorTarget: 'Version', message: 'Version name already exists' })).toBe(
      'Version name already exists.'
    );
  });

  it('keeps the component wording for components, with one full stop', () => {
    expect(logMessage({ type: 'component', errorTarget: 'Component', message: 'Width must be a number' })).toBe(
      'Invalid property detected: Width must be a number.'
    );
    expect(logMessage({ type: 'component', errorTarget: 'Component', message: 'Width must be a number.' })).toBe(
      'Invalid property detected: Width must be a number.'
    );
  });
});
