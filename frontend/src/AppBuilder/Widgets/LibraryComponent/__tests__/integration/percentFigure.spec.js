// A Statistic value that arrives as "75.8%" text (a query that formats its own figure) kept the number and lost the
// sign under the auto format in Ant and MUI ("On-time delivery 75.8"); shadcn's Stat keeps it. formatFigure shows it as a
// percent, and leaves plain numbers and other text as before.
const ant = require('../../../../../../../packs/antd/src/lib/format.ts');
const mui = require('../../../../../../../packs/mui/src/lib/format.ts');

describe.each([
  ['antd', ant],
  ['mui', mui],
])('%s formatFigure', (_pack, { formatFigure }) => {
  it('keeps the percent sign of a figure written with one', () => {
    expect(formatFigure('75.8%')).toBe('75.8%');
    expect(formatFigure(' 0.5% ')).toBe('0.5%');
    expect(formatFigure('150%')).toBe('150%');
    expect(formatFigure('75.8%', 'number')).toBe('75.8%');
    expect(formatFigure('75.8%', 'percent')).toBe('75.8%');
    expect(formatFigure('12.345%', 'auto', 'USD', 2)).toBe('12.35%');
  });
  it('formats plain numbers as before and leaves text alone', () => {
    expect(formatFigure(1234.5)).toBe('1,234.5');
    expect(formatFigure('1200', 'currency', 'USD')).toBe('$1,200.00');
    expect(formatFigure('n/a')).toBeNull();
  });
});
