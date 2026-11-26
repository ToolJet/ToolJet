/**
 * Moving a component into, or out of, a container dropped earlier in the same session.
 *
 * A move that changes the container's height batches that height change with the move. The batch
 * merged the container's whole in-memory definition, and a container dropped this session has a
 * definition section with no value (buildComponentDefinition copies the config's `validation`,
 * which Container and Form do not define). Merging that section threw, the batch was never sent,
 * and the editor showed the move while the server kept the old parent: the move was gone after a
 * reload. After a reload the section comes back as `{}`, which is why the same move then saved.
 *
 * Everything runs against the REAL composed store; only HTTP is controlled.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { containerConfig, formConfig, tableConfig } from '@tooljet/widget-definitions';
import { computeComponentName } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// HTTP is the genuine boundary: record what the editor's autosave sends for a move between parents.
const batchRequests = [];
const server = setupServer(
  http.put('*/v2/apps/:appId/versions/:versionId/components/batch', async ({ request }) => {
    batchRequests.push(await request.json());
    return HttpResponse.json({});
  })
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

const state = () => useStore.getState();

// The store applies a drop synchronously; with saveAfterAction off its returned promise never settles, so it is not awaited.

const PARENT_ID = '3f1c2b7a-5d4e-4c8b-9a1f-2e6d7c8b9a01';
const TABLE_ID = '8a2d4f6c-1b3e-4d5f-8a7c-9b0e1d2c3f45';

/** What a drop produces: the widget's default config, named from the components already on the page. */
const dropped = (id, type, config, { parent, layout }) => ({
  id,
  name: computeComponentName(type, state().getCurrentPageComponents()),
  component: {
    component: type,
    name: config.name,
    displayName: config.displayName,
    definition: JSON.parse(JSON.stringify(config.definition)),
    parent,
  },
  layouts: { desktop: layout },
});

// Tall enough that the container has to grow to fit it, so the move also changes the container's height.
const TABLE_LAYOUT = { top: 0, left: 0, width: 20, height: 460 };
const savedMove = () => batchRequests.flatMap((request) => Object.entries(request.diff.layout?.diff ?? {}));

describe.each([
  ['Container', containerConfig],
  ['Form', formConfig],
])('a %s dropped this session', (type, config) => {
  beforeEach(() => {
    batchRequests.length = 0;
    seedApp({});
  });

  // Break this catches: the batch that carries the move throws before it is sent, so the component
  // shows inside the container but is back on the canvas after a reload.
  test('saves a component moved into it from the canvas', async () => {
    state().addComponentToCurrentPage(
      [dropped(PARENT_ID, type, config, { layout: { top: 0, left: 0, width: 20, height: 300 } })],
      'canvas',
      { saveAfterAction: false }
    );
    state().addComponentToCurrentPage(
      [dropped(TABLE_ID, 'Table', tableConfig, { layout: { ...TABLE_LAYOUT, top: 400 } })],
      'canvas',
      { saveAfterAction: false }
    );

    state().setComponentLayout({ [TABLE_ID]: TABLE_LAYOUT }, PARENT_ID, 'canvas', { updateParent: true });

    await waitFor(() => expect(savedMove()).toHaveLength(1));
    expect(savedMove()[0]).toEqual([
      TABLE_ID,
      { component: { parent: PARENT_ID }, layouts: { desktop: TABLE_LAYOUT } },
    ]);
  });

  // Break this catches: the same throw on the way out, from the height change of the container it leaves.
  test('saves a component moved out of it onto the canvas', async () => {
    state().addComponentToCurrentPage(
      [dropped(PARENT_ID, type, config, { layout: { top: 0, left: 0, width: 20, height: 600 } })],
      'canvas',
      { saveAfterAction: false }
    );
    state().addComponentToCurrentPage(
      [dropped(TABLE_ID, 'Table', tableConfig, { parent: PARENT_ID, layout: TABLE_LAYOUT })],
      'canvas',
      { saveAfterAction: false }
    );
    const onCanvas = { ...TABLE_LAYOUT, top: 700 };

    state().setComponentLayout({ [TABLE_ID]: onCanvas }, undefined, 'canvas', { updateParent: true });

    await waitFor(() => expect(savedMove()).toHaveLength(1));
    expect(savedMove()[0]).toEqual([TABLE_ID, { component: {}, layouts: { desktop: onCanvas } }]);
  });

  // Break this catches: a component dropped this session keeps a definition section with no value,
  // so it differs from the same component after a reload, where every section is an object.
  test('has every definition section the server would return after a reload', async () => {
    state().addComponentToCurrentPage(
      [dropped(PARENT_ID, type, config, { layout: { top: 0, left: 0, width: 20, height: 300 } })],
      'canvas',
      { saveAfterAction: false }
    );

    const { definition } = state().getCurrentPageComponents()[PARENT_ID].component;
    expect(definition.validation).toEqual(config.definition.validation ?? {});
  });
});
