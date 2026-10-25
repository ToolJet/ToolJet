import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { Questionnaire as ShadQuestionnaire } from '../../../../../../../packs/shadcn/src/components/Questionnaire';

installBrowserStubs();

// T16 (UI 2.0 report: Questionnaire answers in List view rows were named by the first row's prompt), checked on the
// pack Questionnaires. A List view draws one instance of the same widget per row, each with its row's resolved props
// and its own exposed values (one cacheKey, one component name); a reorder or a data refresh hands an instance another
// row's items. Each row's answers and currentItem must follow its own items. The pack components, the inline SDK and
// the host renderer are the real ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const antPack = require('../../../../../../../packs/antd/src/index.ts');

const rowItems = (row) => [
  { name: `${row}_pick`, prompt: `${row}: pick one`, type: 'single', choices: [`${row} A`, `${row} B`] },
  { name: `${row}_note`, prompt: `${row}: notes`, type: 'text' },
];
const ROWS = ['alpha', 'beta', 'gamma'];

const PACKS = {
  shadcn: { module: { Questionnaire: ShadQuestionnaire }, ready: '.ui', choice: '[data-answer]' },
  antd: { module: antPack, ready: '.tj-ant-root', choice: '.tj-ant-quiz-choice' },
};

// Draws a "List view": one Questionnaire per row, by row position as the List view keys its rows.
const mountRows = async (pack, rows) => {
  loadLibraryModule.mockResolvedValue(PACKS[pack].module);
  const exposed = rows.map(() => ({}));
  const element = (data) => (
    <div>
      {data.map((row, i) => (
        <InlineLibraryComponent
          key={i}
          bundleUrl="pack.js"
          cssUrl="pack.css"
          cacheKey={`questionnaire-rows-${pack}`}
          componentName="Questionnaire"
          componentProps={{ items: rowItems(row) }}
          componentStyles={{}}
          renderSlot={() => null}
          setExposedVariable={(k, v) => {
            exposed[i][k] = v;
          }}
          fireEvent={() => {}}
          actions={new Map()}
          host={makeHost('Questionnaire', null)}
          dataCy={`q-row-${i}`}
        />
      ))}
    </div>
  );
  const view = render(element(rows));
  const root = (i) => view.container.querySelector(`[data-cy="q-row-${i}"]`)?.shadowRoot;
  await waitFor(() => rows.forEach((_, i) => expect(root(i)?.querySelector(PACKS[pack].ready)).toBeTruthy()));
  return { exposed, root, rerender: (data) => act(() => view.rerender(element(data))) };
};

const expectRowsFollow = async (exposed, rows) =>
  waitFor(() =>
    rows.forEach((row, i) => {
      expect(Object.keys(exposed[i].answers || {}).sort()).toEqual([`${row}_note`, `${row}_pick`]);
      expect(exposed[i].currentItem).toMatchObject({ name: `${row}_pick`, prompt: `${row}: pick one` });
    })
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(Object.keys(PACKS))('T16: %s Questionnaire in List view rows', (pack) => {
  it('names each row answers by its own items, and follows a reorder and a data refresh', async () => {
    const { exposed, root, rerender } = await mountRows(pack, ROWS);
    await expectRowsFollow(exposed, ROWS);
    ROWS.forEach((row, i) => expect(root(i).textContent).toContain(`${row}: pick one`));

    // Answering row 2 changes only row 2's answers.
    act(() => {
      fireEvent.click(root(1).querySelectorAll(PACKS[pack].choice)[1]);
    });
    await waitFor(() => expect(exposed[1].answers.beta_pick).toBe('beta B'));
    expect(exposed[0].answers.alpha_pick).toBeNull();
    expect(exposed[2].answers.gamma_pick).toBeNull();

    // Rows reorder: each instance now holds another row's items.
    const reordered = ['gamma', 'alpha', 'beta'];
    rerender(reordered);
    await expectRowsFollow(exposed, reordered);
    reordered.forEach((row, i) => expect(root(i).textContent).toContain(`${row}: pick one`));
    reordered.forEach((row, i) => expect(Object.keys(exposed[i].answers)).not.toContain(`${ROWS[i]}_pick`));

    // A data refresh with new rows.
    const refreshed = ['delta', 'epsilon', 'zeta'];
    rerender(refreshed);
    await expectRowsFollow(exposed, refreshed);
    refreshed.forEach((row, i) => expect(root(i).textContent).toContain(`${row}: pick one`));
  });
});
