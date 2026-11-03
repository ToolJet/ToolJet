// An Ant Table date column with dateFormat "DD/MM" in a pt-BR table drew "Oct 25, 2026": the column's pattern and the
// table's locale were ignored. A pattern is written as is; without one the date reads in the locale.
const ant = require('../../../../../../packs/antd/src/lib/format.ts');
const mui = require('../../../../../../packs/mui/src/lib/format.ts');

describe.each([
  ['antd', ant],
  ['mui', mui],
])('%s date cells', (_pack, { formatCell, formatDate }) => {
  it('writes the column pattern', () => {
    expect(formatCell('2026-10-25', 'date', 'BRL', 'pt-BR', 'DD/MM')).toBe('25/10');
    expect(formatDate('2026-10-25T09:30:00', { pattern: 'DD MMM YYYY HH:mm' })).toBe('25 Oct 2026 09:30');
  });
  it('reads in the locale, else the currency, else en-US', () => {
    expect(formatCell('2026-10-25', 'date', undefined, 'pt-BR')).toBe(
      new Date(2026, 9, 25).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })
    );
    expect(formatCell('2026-10-25', 'date', 'BRL')).toBe(
      new Date(2026, 9, 25).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: 'numeric' })
    );
    expect(formatCell('2026-10-25', 'date')).toBe('Oct 25, 2026');
  });
});
