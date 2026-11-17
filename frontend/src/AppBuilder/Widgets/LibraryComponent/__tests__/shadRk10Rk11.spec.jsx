import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { Dialog } from '../../../../../../packs/shadcn/src/components/Dialog';
import { FunnelChart } from '../../../../../../packs/shadcn/src/components/FunnelChart';
import { ScatterChart } from '../../../../../../packs/shadcn/src/components/ScatterChart';
import { HeatmapChart } from '../../../../../../packs/shadcn/src/components/HeatmapChart';

// RK-10: an object bound to a Dialog text property threw as a React child. RK-11: Funnel, Scatter and Heatmap
// showed 0.25 as 0.3% on the percent format; the Line chart scales fractions to 25%.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const { percentScale, scaled, formatter } = require('../../../../../../packs/shadcn/src/lib/ui2/charts/chartModel.ts');

beforeEach(() => loadLibraryModule.mockResolvedValue({ Dialog, FunnelChart, ScatterChart, HeatmapChart }));
afterEach(() => {
  document.body.innerHTML = '';
});

const mount = async (componentName, props) => {
  const record = { exposed: {}, events: [], actions: new Map() };
  const host = {
    disabled: false,
    loading: false,
    fieldId: 'rk',
    useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
    setRows: () => {},
    rowSlotAttr: (i) => `tj-row-${i}`,
    registerPopupSlot: () => () => {},
    popupSlotAttr: (slot) => `tj-slot-${slot}`,
  };
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`rk-${componentName}`}
      componentName={componentName}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        record.exposed[k] = v;
      }}
      fireEvent={() => {}}
      actions={record.actions}
      host={host}
      dataCy={componentName}
      popupSlotNames={[]}
      renderPopupSlot={() => null}
    />
  );
  return { record, view };
};

const root = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const shadow = (view) => view.container.querySelector('[data-cy]').shadowRoot;
const drawn = (r) => [...(r?.querySelectorAll('button, [role="alert"]') ?? [])].map((n) => n.textContent).join('|');

describe('RK-10: a shadcn Dialog with an object in a text property', () => {
  it.each(['triggerText', 'title', 'description', 'confirmText', 'cancelText'])(
    'keeps the Dialog and its button when %s is an object',
    async (key) => {
      const { record, view } = await mount('Dialog', {
        triggerText: 'Open it',
        title: 'T',
        description: 'D',
        confirmText: 'OK',
        cancelText: 'Cancel',
        showBody: false,
        [key]: { a: 1 },
      });
      await waitFor(() => expect(record.actions.get('open')).toBeTruthy());
      act(() => record.actions.get('open')());
      await waitFor(() => expect(root()?.querySelector('[role="dialog"]')).toBeTruthy());
      // The trigger button is still there, not an error box.
      expect(shadow(view).querySelectorAll('button').length).toBeGreaterThan(0);
      expect(drawn(shadow(view)) + drawn(root())).not.toMatch(/Objects are not valid|went wrong|error/i);
    }
  );
});

describe('RK-11: percent format on fractions', () => {
  it('formatter scaled by percentScale shows 0.25 as 25%', () => {
    const f = scaled(formatter({ format: 'percent', locale: 'en-US' }), percentScale('percent', [0.6, 0.25]));
    expect(f(0.25)).toBe('25%');
    expect(f(0.6)).toBe('60%');
  });

  it('Funnel shows 0.6 and 0.25 as 60% and 25%', async () => {
    const { view } = await mount('FunnelChart', {
      data: [
        { stage: 'A', n: 0.6 },
        { stage: 'B', n: 0.25 },
      ],
      stageField: 'stage',
      valueField: 'n',
      yAxisFormat: 'percent',
      locale: 'en-US',
    });
    await waitFor(() => expect(shadow(view).querySelector('.ui2-funnel-value')).toBeTruthy());
    const shown = [...shadow(view).querySelectorAll('.ui2-funnel-value')].map((n) => n.textContent);
    expect(shown).toEqual(['60%', '25%']);
  });

  it('Heatmap shows 0.25 as 25%', async () => {
    const { view } = await mount('HeatmapChart', {
      data: [
        { day: 'Mon', hour: '9', v: 0.6 },
        { day: 'Mon', hour: '10', v: 0.25 },
      ],
      xField: 'hour',
      yField: 'day',
      valueField: 'v',
      yAxisFormat: 'percent',
      showValues: true,
      locale: 'en-US',
    });
    await waitFor(() => expect(shadow(view).querySelector('.ui2-heatmap-cell')).toBeTruthy());
    const cells = [...shadow(view).querySelectorAll('.ui2-heatmap-cell')].map((n) => n.textContent);
    expect(cells).toEqual(expect.arrayContaining(['60%', '25%']));
  });
});
