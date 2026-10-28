/**
 * Deleting a widget whose own properties read its own exposed value.
 *
 * ProgressBar (`label`) and CircularProgressBar (`text`) are seeded on drop with
 * `{{components.<own-id>.value}}%` (componentsSlice.buildComponentDefinition), so the widget's `value`
 * has a dependent that belongs to the widget itself. Once the mounted widget has published `value`,
 * deleteComponents re-resolves that dependent against a component it has already removed. If that
 * throws, the delete request is never sent: the widget disappears locally, comes back after a reload,
 * and its name is handed out again.
 *
 * Everything runs against the REAL composed store; nothing here is mocked.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { progressbarConfig, circularProgressbarConfig } from '@tooljet/widget-definitions';
import { computeComponentName } from '@/AppBuilder/AppCanvas/appCanvasUtils';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// HTTP is the genuine boundary: record what the editor's autosave sends for a component delete.
const deleteRequests = [];
const server = setupServer(
  http.delete('*/v2/apps/:appId/versions/:versionId/components', async ({ request }) => {
    deleteRequests.push(await request.json());
    return HttpResponse.json({});
  })
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

const state = () => useStore.getState();

const FIRST_ID = '6659f4e9-aff1-4ece-bf00-1158bb29d277';
const SECOND_ID = 'da9fbe6b-ef4b-4c38-a398-8cef411d390c';
const TEXT_ID = '0b1c4a2e-3d5f-4a6b-8c7d-9e0f1a2b3c4d';

/** What a drop produces: the name is computed from the components already on the page. */
const dropped = (id, type, config) => ({
  id,
  name: computeComponentName(type, state().getCurrentPageComponents()),
  component: {
    component: type,
    name: config.name,
    displayName: config.displayName,
    definition: JSON.parse(JSON.stringify(config.definition)),
  },
  layouts: { desktop: { top: 0, left: 0, width: 7, height: 50 } },
});

/** What the mounted widget publishes on mount (Progressbar.jsx / CirularProgressbar.jsx). */
const publishValue = (id) =>
  state().setExposedValues(id, 'components', { value: 50, isVisible: true, isLoading: false });

const pageNames = () =>
  Object.values(state().getCurrentPageComponents())
    .map((component) => component.component.name)
    .sort();

describe.each([
  ['ProgressBar', progressbarConfig, 'progressbar'],
  ['CircularProgressBar', circularProgressbarConfig, 'circularprogressbar'],
])('deleting a %s', (type, config, baseName) => {
  beforeEach(() => {
    deleteRequests.length = 0;
    seedApp({});
    [FIRST_ID, SECOND_ID].forEach((id) => {
      state().addComponentToCurrentPage([dropped(id, type, config)], 'canvas', { saveAfterAction: false });
      publishValue(id);
    });
  });

  // Break this catches: the delete throws while re-resolving the widget's own `label`/`text`, so the
  // widget leaves the canvas but the delete request is never sent and it returns after a reload.
  test('sends the delete to the server', async () => {
    expect(() => state().deleteComponents([FIRST_ID], 'canvas')).not.toThrow();

    await waitFor(() => expect(deleteRequests).toHaveLength(1));
    expect(deleteRequests[0].diff).toEqual([FIRST_ID]);
  });

  // Break this catches: a delete that aborts half way leaves the name mapped to a removed id, so the
  // next widget dropped on the page is given the same name as the one the user deleted.
  test('frees its name so the next widget does not reuse a live one', () => {
    expect(() => state().deleteComponents([FIRST_ID], 'canvas', { saveAfterAction: false })).not.toThrow();

    expect(pageNames()).toEqual([`${baseName}2`]);
    expect(state().getComponentNameIdMapping()).toEqual({ [`${baseName}2`]: SECOND_ID });
  });
});

describe('deleting a ProgressBar that another component reads', () => {
  // Break this catches: skipping dependents while deleting also skips the ones on OTHER components,
  // leaving them showing the value of a widget that no longer exists.
  test('still re-resolves the other component that read its value', async () => {
    seedApp({});
    state().addComponentToCurrentPage([dropped(FIRST_ID, 'ProgressBar', progressbarConfig)], 'canvas', {
      saveAfterAction: false,
    });
    state().addComponentToCurrentPage(
      [componentDefinition(TEXT_ID, 'text1', 'Text', { text: binding('{{components.progressbar1.value}}') })],
      'canvas',
      { saveAfterAction: false }
    );
    publishValue(FIRST_ID);
    await waitFor(() => expect(state().getResolvedComponent(TEXT_ID)?.properties?.text).toBe('50'));

    expect(() => state().deleteComponents([FIRST_ID], 'canvas', { saveAfterAction: false })).not.toThrow();

    await waitFor(() => expect(state().getResolvedComponent(TEXT_ID)?.properties?.text).not.toBe('50'));
  });
});
