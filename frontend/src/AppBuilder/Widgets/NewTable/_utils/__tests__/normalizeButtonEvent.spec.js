const mockDebuggerLog = jest.fn();
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({
      debugger: { log: mockDebuggerLog },
    }),
  },
}));

import { normalizeButtonEvent } from '../normalizeButtonEvent';

describe('normalizeButtonEvent', () => {
  beforeEach(() => {
    mockDebuggerLog.mockClear();
  });

  it('passes an already-internal-format event through unchanged', () => {
    const evt = { eventId: 'onClick', actionId: 'show-alert', message: 'Hi' };
    expect(normalizeButtonEvent(evt, 'b1')).toBe(evt);
  });

  it('maps a user-friendly event/action label pair to internal eventId/actionId', () => {
    const result = normalizeButtonEvent({ event: 'On click', action: 'Show Alert', message: 'Hi' }, 'b1');
    expect(result).toEqual({ eventId: 'onClick', actionId: 'show-alert', message: 'Hi' });
  });

  it("[Table-BUG-015] returns null and logs an app Debugger error, instead of throwing, for a null/undefined entry in a button's events array", () => {
    expect(() => normalizeButtonEvent(null, 'b1', 'tbl1')).not.toThrow();
    expect(normalizeButtonEvent(null, 'b1', 'tbl1')).toBeNull();
    expect(() => normalizeButtonEvent(undefined, 'b1', 'tbl1')).not.toThrow();
    expect(normalizeButtonEvent(undefined, 'b1', 'tbl1')).toBeNull();

    expect(mockDebuggerLog).toHaveBeenCalledWith(
      expect.objectContaining({
        logLevel: 'error',
        componentId: 'tbl1',
        message: expect.stringContaining('Malformed event in button "b1"'),
      })
    );
  });
});
