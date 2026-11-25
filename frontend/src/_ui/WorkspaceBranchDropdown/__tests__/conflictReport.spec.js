// The Reported line carries a time zone.
import { buildConflictReport } from '@/_ui/WorkspaceBranchDropdown/conflictReport';

const reportedAt = new Date(2026, 10, 25, 12, 17);

function reportedLine(text) {
  return text.split('\n').find((line) => line.startsWith('Reported:'));
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('appends the short time zone name to the Reported time', () => {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({
    formatToParts: () => [{ type: 'timeZoneName', value: 'IST' }],
  }));

  const { text } = buildConflictReport({ action: 'Pull branch', reportedAt });

  expect(reportedLine(text)).toBe('Reported:  2026-11-25 12:17 IST');
});

test('falls back to a UTC offset when the time zone name is unavailable', () => {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
    throw new Error('unsupported');
  });
  jest.spyOn(reportedAt, 'getTimezoneOffset').mockReturnValue(-330);

  const { text } = buildConflictReport({ action: 'Pull branch', reportedAt });

  expect(reportedLine(text)).toBe('Reported:  2026-11-25 12:17 UTC+05:30');
});

test('formats negative offsets and keeps the JSON reportedAt in UTC', () => {
  jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => ({ formatToParts: () => [] }));
  jest.spyOn(reportedAt, 'getTimezoneOffset').mockReturnValue(240);

  const { text, json } = buildConflictReport({ action: 'Pull branch', reportedAt });

  expect(reportedLine(text)).toBe('Reported:  2026-11-25 12:17 UTC-04:00');
  expect(JSON.parse(json).reportedAt).toBe(reportedAt.toISOString());
});
