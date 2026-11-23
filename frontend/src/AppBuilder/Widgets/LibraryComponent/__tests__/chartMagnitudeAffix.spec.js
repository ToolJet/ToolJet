// Chart values already in thousands with a " k€" suffix: the axis compacted 4500 to "4,5 k" and added the suffix,
// "4,5 k k€". An affix that names a magnitude keeps the axis from compacting; other affixes do not.
const {
  formatter,
  affixFormatter,
  namesMagnitude,
} = require('../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel.ts');

describe('shadcn chart axis with a magnitude in the affix', () => {
  it('reads the magnitude in common prefixes and suffixes', () => {
    for (const a of [' k€', 'k', ' M$', ' Mio', ' Md', ' bn', ' mil', ' lakh', 'K ', ' million'])
      expect(namesMagnitude(a)).toBe(true);
    for (const a of [' km', ' kg', '€', '$', ' users', ' ms', '%', '', null]) expect(namesMagnitude(a)).toBe(false);
  });
  it('does not compact an axis whose suffix names the magnitude', () => {
    expect(formatter({ format: 'number', suffix: ' k€', locale: 'en-US' }, true)(4500)).toBe('4,500 k€');
    expect(formatter({ format: 'number', suffix: ' users', locale: 'en-US' }, true)(4500)).toBe('4.5K users');
    expect(affixFormatter({ valueSuffix: 'M' }, true)(1200)).toBe('1,200M');
    expect(affixFormatter({ valueSuffix: ' items' }, true)(1200)).toBe('1.2K items');
  });
  it('still compacts when the format asks for it', () => {
    expect(formatter({ format: 'compact', suffix: ' k€', locale: 'en-US' })(4500)).toBe('4.5K k€');
  });
});
