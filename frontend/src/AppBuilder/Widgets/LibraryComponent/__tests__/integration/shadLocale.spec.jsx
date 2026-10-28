import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { localeFor, moneyDigits, numberFormat } from '../../../../../../../packs/shadcn/src/lib/locale';
import { statValue, statChange } from '../../../../../../../packs/shadcn/src/lib/statModel';
import { formatter } from '../../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel';
import { formatValue } from '../../../../../../../packs/shadcn/src/lib/format';
import { summaryFigures } from '../../../../../../../packs/shadcn/src/lib/ui2/display/summary';
import { recordItems } from '../../../../../../../packs/shadcn/src/lib/ui2/display/lists/model';
import { formatFigure } from '../../../../../../../packs/shadcn/src/lib/ui2/charts/progressModel';
import { popupLines } from '../../../../../../../packs/shadcn/src/lib/ui2/charts/mapModel';

installBrowserStubs();

// shadcn pack, 2026-10-25: every figure was written in en-US (or the viewer's browser locale), so a BRL Stat read
// "R$8,799" where Brazil writes "R$ 8.799,00". Figures now take the author's locale, else the currency's home locale,
// else en-US, so apps that set neither keep their look.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const SOURCE = require('../../../../../../../packs/shadcn/src/index.ts');
// Intl writes a no-break space (U+00A0, or U+202F before some currency marks); compare with plain spaces.
const plain = (text) => String(text).replace(/[  ]/g, ' ');

let mounts = 0;
const mountStat = async (props) => {
  loadLibraryModule.mockResolvedValue({ Stat: SOURCE.Stat });
  mounts += 1;
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl={`loc-${mounts}.js`}
        cssUrl={`loc-${mounts}.css`}
        cacheKey={`locale-Stat-${mounts}`}
        componentName="Stat"
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost('Stat', {})}
        dataCy="pack-widget"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.ui-stat-value')).not.toBeNull());
  return plain(root().querySelector('.ui-stat-value').textContent);
};

afterEach(cleanup);

describe('localeFor', () => {
  it('an explicit locale wins, canonicalised', () => {
    expect(localeFor('BRL', 'en-GB')).toBe('en-GB');
    expect(localeFor('USD', 'pt-br')).toBe('pt-BR');
  });
  it('else the currency gives it', () => {
    expect(localeFor('BRL')).toBe('pt-BR');
    expect(localeFor('eur', '')).toBe('de-DE');
    expect(localeFor(' INR ')).toBe('en-IN');
    expect(localeFor('JPY')).toBe('ja-JP');
    expect(localeFor('GBP', '   ')).toBe('en-GB');
    expect(localeFor('USD')).toBe('en-US');
  });
  it('else en-US: no currency, an unknown one, or a locale that is not one', () => {
    expect(localeFor()).toBe('en-US');
    expect(localeFor('XYZ')).toBe('en-US');
    expect(localeFor(42, {})).toBe('en-US');
    expect(localeFor('BRL', 'not a locale!')).toBe('pt-BR');
  });
  it('English locales keep whole money without cents; others write the currency decimals', () => {
    expect(moneyDigits(8799, 'en-US')).toEqual({ minimumFractionDigits: 0, maximumFractionDigits: 2 });
    expect(moneyDigits(87.5, 'en-GB')).toEqual({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
    expect(moneyDigits(8799, 'pt-BR')).toEqual({});
  });
  it('caches one formatter per locale and options, and falls back on a bad currency', () => {
    expect(numberFormat('de-DE', { maximumFractionDigits: 2 })).toBe(numberFormat('de-DE', { maximumFractionDigits: 2 }));
    expect(numberFormat('en-US', { maximumFractionDigits: 2 })).not.toBe(numberFormat('de-DE', { maximumFractionDigits: 2 }));
    expect(plain(numberFormat('de-DE', { style: 'currency', currency: 'U$' }).format(1234.5))).toBe('1.234,5');
  });
});

describe('Stat figures', () => {
  it('BRL follows the currency: R$ 8.799,00, not R$8,799', () => {
    expect(plain(statValue(8799, { valueFormat: 'currency', currency: 'BRL' }))).toBe('R$ 8.799,00');
    expect(plain(statValue('8799', { valueFormat: 'currency', currency: 'BRL', locale: '' }))).toBe('R$ 8.799,00');
  });
  it('an explicit locale wins over the currency', () => {
    expect(plain(statValue(8799, { valueFormat: 'currency', currency: 'BRL', locale: 'pt-BR' }))).toBe('R$ 8.799,00');
    expect(plain(statValue(8799, { valueFormat: 'currency', currency: 'BRL', locale: 'en-US' }))).toBe('R$8,799');
    expect(plain(statValue(1234.5, { valueFormat: 'number', currency: 'USD', locale: 'de-DE' }))).toBe('1.234,5');
  });
  it('en-US is unchanged', () => {
    expect(statValue(8799, { valueFormat: 'currency', currency: 'USD' })).toBe('$8,799');
    expect(statValue(3043.5, { valueFormat: 'currency', currency: 'USD' })).toBe('$3,043.50');
    expect(statValue(1250, {})).toBe('1,250');
    expect(statValue(18400, { valueFormat: 'compact' })).toBe('18.4K');
    expect(statValue(42.5, { valueFormat: 'percent' })).toBe('42.5%');
    expect(statChange(1200, 'currency', 'USD')?.text).toBe('+$1,200.00');
  });
  it('the change chip follows the locale too', () => {
    expect(plain(statChange(1200, 'currency', 'BRL')?.text)).toBe('+R$ 1.200,00');
    expect(plain(statChange(-3.25, 'percent', 'EUR')?.text)).toBe('−3,3%');
  });
  it('the mounted Stat card draws R$ 8.799,00 for BRL, with and without a locale', async () => {
    expect(await mountStat({ value: 8799, valueFormat: 'currency', currency: 'BRL' })).toBe('R$ 8.799,00');
    expect(await mountStat({ value: 8799, valueFormat: 'currency', currency: 'BRL', locale: 'pt-BR' })).toBe('R$ 8.799,00');
    expect(await mountStat({ value: 8799, valueFormat: 'currency', currency: 'USD' })).toBe('$8,799');
  });
});

describe('charts and lists', () => {
  it('a de-DE axis label groups with dots', () => {
    const tick = formatter({ format: 'number', locale: 'de-DE' }, false);
    expect(tick(1234567.5)).toBe('1.234.567,5');
    const money = formatter({ format: 'currency', currency: 'EUR' }, false);
    expect(plain(money(1200))).toBe('1.200,00 €');
    const short = formatter({ format: 'currency', currency: 'EUR', locale: 'de-DE' }, true);
    expect(plain(short(2500000))).toBe('2,5 Mio. €');
  });
  it('en-US charts are unchanged', () => {
    expect(formatter({ format: 'currency', currency: 'USD' }, false)(3043.5)).toBe('$3,043.50');
    expect(formatter({ format: 'currency', currency: 'USD' }, false)(8799)).toBe('$8,799');
    expect(formatter({ format: 'number' }, true)(25000)).toBe('25K');
    expect(formatValue(8799, { format: 'currency', currency: 'USD' })).toBe('$8,799');
  });
  it('chart formatValue derives the locale from the currency', () => {
    expect(plain(formatValue(8799, { format: 'currency', currency: 'BRL' }))).toBe('R$ 8.799');
    expect(plain(formatValue(8799, { format: 'currency', currency: 'BRL', decimals: 2 }))).toBe('R$ 8.799,00');
  });
  it('Summary strip, Record list, Progress list and Map popups follow the locale', () => {
    const [fig] = summaryFigures([{ label: 'Revenue', value: 8799, delta: 1200 }], { valueFormat: 'currency', currency: 'BRL', deltaFormat: 'currency' });
    expect(plain(fig.value)).toBe('R$ 8.799,00');
    expect(plain(fig.delta.text)).toBe('+R$ 1.200,00');
    const [rec] = recordItems([{ id: 1, name: 'A', total: 8799 }], { titleField: 'name', valueField: 'total', valueFormat: 'currency', currency: 'BRL' });
    expect(plain(rec.value)).toBe('R$ 8.799,00');
    expect(plain(formatFigure(8799, 'number', 'USD', 'de-DE'))).toBe('8.799');
    expect(plain(popupLines({ total: 8799 }, 'total|currency', { currency: 'BRL' })[0])).toBe('R$ 8.799,00');
    expect(popupLines({ total: 8799 }, 'total|currency')[0]).toBe('$8,799');
  });
});
