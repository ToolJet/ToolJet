import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import * as antLocale from '../../../../../../packs/antd/src/lib/locale';
import * as muiLocale from '../../../../../../packs/mui/src/lib/locale';
import * as shadLocale from '../../../../../../packs/shadcn/src/lib/locale';
import * as antFormat from '../../../../../../packs/antd/src/lib/format';
import * as muiFormat from '../../../../../../packs/mui/src/lib/format';
import { summaryFigures } from '../../../../../../packs/antd/src/lib/ui2/display/summary';
import { recordItems } from '../../../../../../packs/antd/src/lib/ui2/display/lists/model';
import { formatFigure as progressFigure } from '../../../../../../packs/antd/src/lib/ui2/charts/progressModel';
import { popupLines } from '../../../../../../packs/antd/src/lib/ui2/charts/mapModel';

installBrowserStubs();

// Ant and MUI packs, 2026-10-25: every figure was written in en-US (or the viewer's browser locale), so a BRL Statistic
// in a Portuguese app read "R$8,799.00" where Brazil writes "R$ 8.799,00". As in shadcn 2.1.25, figures now take the
// author's locale, else the currency's home locale, else en-US, so apps that set neither keep their look.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ANT = require('../../../../../../packs/antd/src/index.ts');
const MUI = require('../../../../../../packs/mui/src/index.ts');
// Intl writes a no-break space (U+00A0, or U+202F before some currency marks); compare with plain spaces.
const plain = (text) => String(text).replace(/[  ]/g, ' ');

let mounts = 0;
const mount = async (pack, name, props, ready) => {
  loadLibraryModule.mockResolvedValue({ [name]: pack[name] });
  mounts += 1;
  let view;
  await act(async () => {
    view = render(
      <InlineLibraryComponent
        bundleUrl={`loc-${mounts}.js`}
        cssUrl={`loc-${mounts}.css`}
        cacheKey={`am-locale-${name}-${mounts}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        actions={new Map()}
        host={makeHost(name, {})}
        dataCy="pack-widget"
      />
    );
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root()?.querySelector(ready)).not.toBeNull());
  return root();
};
const antStatistic = async (props) =>
  plain(
    (await mount(ANT, 'Statistic', props, '.ant-statistic-content-value')).querySelector('.ant-statistic-content-value')
      .textContent
  );
const muiStatCard = async (props) =>
  plain((await mount(MUI, 'StatCard', props, '.tj-mui-stat-figure')).querySelector('.tj-mui-stat-figure').textContent);

afterEach(cleanup);

describe('the shared locale helper', () => {
  it('is the same file in all three packs', () => {
    expect(Object.keys(antLocale).sort()).toEqual(Object.keys(shadLocale).sort());
    expect(antLocale.CURRENCY_LOCALES).toEqual(shadLocale.CURRENCY_LOCALES);
    expect(muiLocale.CURRENCY_LOCALES).toEqual(shadLocale.CURRENCY_LOCALES);
  });
  it.each([
    ['antd', antLocale],
    ['mui', muiLocale],
  ])('%s localeFor: the author, else the currency, else en-US', (_pack, { localeFor }) => {
    expect(localeFor('BRL', 'en-GB')).toBe('en-GB');
    expect(localeFor('USD', 'pt-br')).toBe('pt-BR');
    expect(localeFor('BRL')).toBe('pt-BR');
    expect(localeFor('eur', '')).toBe('de-DE');
    expect(localeFor('JPY')).toBe('ja-JP');
    expect(localeFor('USD')).toBe('en-US');
    expect(localeFor()).toBe('en-US');
    expect(localeFor('XYZ')).toBe('en-US');
    expect(localeFor('BRL', 'not a locale!')).toBe('pt-BR');
  });
});

describe.each([
  ['antd', antFormat],
  ['mui', muiFormat],
])('%s lib/format', (_pack, { formatNumber, formatFigure, formatCell }) => {
  it('BRL follows the currency: R$ 8.799,00, not R$8,799.00', () => {
    expect(plain(formatNumber(8799, 'currency', 'BRL'))).toBe('R$ 8.799,00');
    expect(plain(formatFigure('8799', 'currency', 'BRL'))).toBe('R$ 8.799,00');
    expect(plain(formatFigure(8799, 'currency', 'BRL', null, 'pt-BR'))).toBe('R$ 8.799,00');
  });
  it('an explicit locale wins over the currency', () => {
    expect(formatFigure(8799, 'currency', 'BRL', null, 'en-US')).toBe('R$8,799.00');
    expect(plain(formatNumber(1234.5, 'number', 'USD', null, 'de-DE'))).toBe('1.234,5');
  });
  it('en-US is unchanged', () => {
    expect(formatNumber(8799, 'currency', 'USD')).toBe('$8,799.00');
    expect(formatNumber(1250)).toBe('1,250');
    expect(formatNumber(18400, 'compact')).toBe('18.4K');
    expect(formatNumber(0.425, 'percent')).toBe('42.5%');
    expect(formatCell(1234.5)).toBe('1,234.5');
    expect(formatCell('1200', 'currency', 'USD')).toBe('$1,200.00');
  });
  it('percent text keeps its sign, and precision still sets the decimals, in the locale', () => {
    expect(formatFigure('75.8%')).toBe('75.8%');
    expect(plain(formatFigure('75.8%', 'auto', 'USD', null, 'pt-BR'))).toBe('75,8%');
    expect(plain(formatFigure('12.345%', 'auto', 'EUR', 2))).toBe('12,35 %');
    expect(plain(formatFigure(8799, 'currency', 'BRL', 0))).toBe('R$ 8.799');
    expect(formatFigure(8799.456, 'number', 'USD', 1)).toBe('8,799.5');
  });
  it('a de-DE chart tick groups with dots', () => {
    expect(plain(formatNumber(1234567.5, 'number', 'USD', null, 'de-DE'))).toBe('1.234.567,5');
    expect(plain(formatNumber(2500000, 'compact', 'EUR'))).toBe('2,5 Mio.');
    expect(plain(formatNumber(1200, 'currency', 'EUR'))).toBe('1.200,00 €');
  });
  it('a table money column follows its currency, or the table locale', () => {
    expect(plain(formatCell(8799, 'currency', 'BRL'))).toBe('R$ 8.799,00');
    expect(plain(formatCell('8799', 'currency', 'USD', 'pt-BR'))).toBe('US$ 8.799,00');
    expect(formatCell(8799, 'currency', 'USD')).toBe('$8,799.00');
  });
});

describe('Ant Statistic and MUI StatCard, mounted', () => {
  it('Ant Statistic draws R$ 8.799,00 for BRL, with and without a locale; USD is unchanged', async () => {
    expect(await antStatistic({ value: 8799, formatter: 'currency', currency: 'BRL' })).toBe('R$ 8.799,00');
    expect(await antStatistic({ value: '8799', formatter: 'currency', currency: 'BRL', locale: 'pt-BR' })).toBe(
      'R$ 8.799,00'
    );
    expect(await antStatistic({ value: 8799, formatter: 'currency', currency: 'BRL', locale: 'en-US' })).toBe(
      'R$8,799.00'
    );
    expect(await antStatistic({ value: 8799, formatter: 'currency', currency: 'USD' })).toBe('$8,799.00');
  });
  it('MUI StatCard draws R$ 8.799,00 for BRL, with and without a locale; USD is unchanged', async () => {
    expect(await muiStatCard({ value: 8799, format: 'currency', currency: 'BRL' })).toBe('R$ 8.799,00');
    expect(await muiStatCard({ value: 8799, format: 'currency', currency: 'BRL', locale: 'pt-BR' })).toBe(
      'R$ 8.799,00'
    );
    expect(await muiStatCard({ value: 8799, format: 'currency', currency: 'USD' })).toBe('$8,799.00');
    expect(await muiStatCard({ value: 14000 })).toBe('14K');
  });
  it('Ant Table draws a money column in the currency locale', async () => {
    const root = await mount(
      ANT,
      'Table',
      {
        dataSource: [{ id: 1, item: 'Bike', amount: 8799 }],
        columns: [
          { title: 'Item', dataIndex: 'item' },
          { title: 'Amount', dataIndex: 'amount', format: 'currency' },
        ],
        currency: 'BRL',
      },
      '.ant-table-tbody .ant-table-cell'
    );
    const cells = [...root.querySelectorAll('.ant-table-tbody td')].map((td) => plain(td.textContent));
    expect(cells).toContain('R$ 8.799,00');
  });
});

describe('Ant UI 2.0 lists and figures follow the locale', () => {
  it('Summary strip, Record list, Progress list and Map popups', () => {
    const [fig] = summaryFigures([{ label: 'Revenue', value: 8799, delta: 1200 }], {
      valueFormat: 'currency',
      currency: 'BRL',
      deltaFormat: 'currency',
    });
    expect(plain(fig.value)).toBe('R$ 8.799,00');
    expect(plain(fig.delta.text)).toBe('+R$ 1.200,00');
    const [rec] = recordItems([{ id: 1, name: 'A', total: 8799 }], {
      titleField: 'name',
      valueField: 'total',
      valueFormat: 'currency',
      currency: 'BRL',
    });
    expect(plain(rec.value)).toBe('R$ 8.799,00');
    expect(plain(progressFigure(8799, 'number', 'USD', 'de-DE'))).toBe('8.799');
    expect(plain(popupLines({ total: 8799 }, 'total|currency', { currency: 'BRL' })[0])).toBe('R$ 8.799,00');
    expect(popupLines({ total: 8799 }, 'total|currency')[0]).toBe('$8,799');
  });
});
