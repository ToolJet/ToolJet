/**
 * The server keeps a saved component whose type it has no widget config for (a widget from a newer ToolJet, such as
 * the UI 2.0 widgets whose types start with `Shad`) exactly as stored, on every path that serves or copies an app.
 *
 * 1. Loading an app merges each component with its widget defaults (buildComponentMetaDefinition). An unknown type
 *    has none: it is served as stored, as the EE override already does, instead of failing the whole request.
 * 2. Children of a UI 2.0 ShadTabs store their parent as `{tabsId}-{tabId}`, like Tabs. Page duplicate, app import
 *    and clone, and version copy keep them in their tab; before, import and clone dropped them as orphans and page
 *    duplicate moved them to the page canvas.
 */

let pageComponents: any[] = [];
const saved: any[] = [];

function makeMockManager() {
  return {
    find: jest.fn().mockImplementation(async (entity: any) => (entity?.name === 'Component' ? pageComponents : [])),
    create: jest.fn().mockImplementation((_entity: any, values: any) => ({ ...values })),
    save: jest.fn().mockImplementation(async (entityOrRows: any, rows?: any) => {
      const list = Array.isArray(entityOrRows) ? entityOrRows : rows;
      if (Array.isArray(list)) saved.push(...list);
      return list;
    }),
  };
}

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => cb(makeMockManager())),
  dbTransactionForAppVersionAssociationsUpdate: jest.fn(),
}));

jest.mock('../../../../src/modules/apps/services/component.service');
jest.mock('../../../../src/modules/apps/services/page.util.service');
jest.mock('../../../../src/modules/apps/services/event.service');

import { AppsUtilService } from '../../../../src/modules/apps/util.service';
import { PageService } from '../../../../src/modules/apps/services/page.service';
import {
  isChildOfSlottedParent,
  remapParentIdForVersionCopy,
  SLOTTED_PARENT_TYPES,
} from '../../../../src/modules/versions/helpers/version-copy-parent.helper';

describe('loading an app with a component of an unknown type', () => {
  const utilService = new AppsUtilService(null as any, null as any, null as any, null as any, null as any, null as any);

  const stored = () => ({
    component: {
      component: 'ShadKanban',
      name: 'kanban1',
      definition: {
        properties: { title: { value: 'Board' } },
        styles: { accent: { value: '#3e63dd' } },
        others: { showOnDesktop: { value: '{{true}}' } },
      },
    },
    layouts: { desktop: { top: 0, left: 0, width: 8, height: 40 } },
  });

  it('serves the unknown component as stored and still merges the known ones', () => {
    const [page] = utilService.mergeDefaultComponentData([
      {
        id: 'page-1',
        components: {
          kanban1: stored(),
          btn1: {
            component: {
              component: 'Button',
              name: 'button1',
              definition: { properties: { text: { value: 'Save' } } },
            },
            layouts: { desktop: { top: 0, left: 0, width: 4, height: 40 } },
          },
        },
      },
    ]);

    expect(page.components.kanban1).toEqual(stored());
    expect(page.components.btn1.component.definition.properties.text).toEqual({ value: 'Save' });
    // Merged from the Button widget config.
    expect(page.components.btn1.component.definition.properties.loadingState).toBeDefined();
  });
});

const SHAD_TABS = '11111111-1111-4111-8111-111111111111';
const TABS = '22222222-2222-4222-8222-222222222222';
const CONTAINER = '33333333-3333-4333-8333-333333333333';
const component = (id: string, name: string, type: string, parent: string | null = null) => ({
  id,
  name,
  type,
  parent,
  pageId: 'page-1',
  properties: {},
  styles: {},
});

const makePageService = () =>
  new PageService(
    null as any, // componentsService
    null as any, // pageHelperService
    { findAllEventsWithSourceId: jest.fn().mockResolvedValue([]) } as any, // eventHandlerService
    { warn: jest.fn() } as any // transactionLogger
  );

describe('copying the children of a UI 2.0 ShadTabs', () => {
  beforeEach(() => {
    saved.length = 0;
    pageComponents = [
      component(SHAD_TABS, 'stabs', 'ShadTabs'),
      component('44444444-4444-4444-8444-444444444444', 'shadFirst', 'ShadInput', `${SHAD_TABS}-t0`),
      component('55555555-5555-4555-8555-555555555555', 'shadSecond', 'Text', `${SHAD_TABS}-t1`),
      component(TABS, 'ntabs', 'Tabs'),
      component('66666666-6666-4666-8666-666666666666', 'nativeFirst', 'Text', `${TABS}-t0`),
      component(CONTAINER, 'cont', 'Container'),
      component('77777777-7777-4777-8777-777777777777', 'inCont', 'ShadButton', CONTAINER),
    ];
  });

  it('page duplicate keeps a ShadTabs child in its tab, as it does for Tabs, and copies unknown types as stored', async () => {
    await makePageService().clonePageEventsAndComponents('page-1', 'page-2');
    const byName = Object.fromEntries(saved.filter((c) => c.pageId === 'page-2').map((c) => [c.name, c]));
    expect(byName.shadFirst.parent).toBe(`${byName.stabs.id}-t0`);
    expect(byName.shadSecond.parent).toBe(`${byName.stabs.id}-t1`);
    expect(byName.nativeFirst.parent).toBe(`${byName.ntabs.id}-t0`);
    expect(byName.inCont.parent).toBe(byName.cont.id);
    expect(byName.stabs.id).not.toBe(SHAD_TABS);
    expect(byName.stabs.type).toBe('ShadTabs');
    expect(byName.shadFirst.type).toBe('ShadInput');
  });

  it('import, clone and version copy treat a ShadTabs tab as a slot', () => {
    expect(SLOTTED_PARENT_TYPES).toEqual(expect.arrayContaining(['Tabs', 'ShadTabs', 'Calendar']));
    expect(isChildOfSlottedParent(`${SHAD_TABS}-t0`, pageComponents)).toBe(true);
    expect(isChildOfSlottedParent(`${TABS}-t1`, pageComponents)).toBe(true);
    // A plain parent id, or a suffix on a parent without slots, is not a tab.
    expect(isChildOfSlottedParent(SHAD_TABS, pageComponents)).toBe(false);
    expect(isChildOfSlottedParent(`${CONTAINER}-t0`, pageComponents)).toBe(false);
    expect(isChildOfSlottedParent('99999999-9999-4999-8999-999999999999-t0', pageComponents)).toBe(false);
  });

  it('version copy remaps a ShadTabs child onto the new tabs id and keeps its tab', () => {
    const idMap = { [SHAD_TABS]: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' };
    expect(remapParentIdForVersionCopy(`${SHAD_TABS}-t1`, idMap, new Set([SHAD_TABS]))).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa-t1'
    );
  });
});
