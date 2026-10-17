/**
 * The UI 2.0 pack's rename table and the pure rewrites the import path uses (the data migration carries a frozen copy
 * of the same functions). No database: every function here takes and returns plain JSON.
 */
import {
  UI2_RENAMES,
  renamesFor,
  renameEventHandler,
  rewriteReferences,
  renameProperties,
  rewriteStringsDeep,
  buildRenamesByComponentRef,
  migrateFlexContainerCardStyle,
  renameEventHandlerRow,
  applyUi2RenamesToImport,
} from '../../../../src/modules/apps/services/ui2-legacy-names';

const LIST_ID = '11111111-1111-4111-8111-111111111111';
const KANBAN_ID = '22222222-2222-4222-8222-222222222222';
const BUTTON_ID = '33333333-3333-4333-8333-333333333333';
const SELECT_ID = '44444444-4444-4444-8444-444444444444';

const components = [
  { id: LIST_ID, name: 'orders', type: 'ShadListView' },
  { id: KANBAN_ID, name: 'board', type: 'ShadKanban' },
  { id: BUTTON_ID, name: 'save', type: 'ShadButton' },
  { id: SELECT_ID, name: 'status', type: 'ShadSelect' },
];
const typesById = Object.fromEntries(components.map((c) => [c.id, c.type]));
const byRef = buildRenamesByComponentRef(components);
const rewrite = (text: string) => rewriteReferences(text, byRef);

describe('renamesFor', () => {
  it('merges the common actions and returns null for other types', () => {
    expect(renamesFor('ShadListView').actions.disable).toBe('setDisable');
    expect(renamesFor('ShadListView').exposed.selectedRow).toBe('selectedRecord');
    expect(renamesFor('ListView')).toBeNull();
  });

  it('never maps a new name back onto an old one of the same type (so a second pass changes nothing)', () => {
    for (const type of Object.keys(UI2_RENAMES)) {
      const r = renamesFor(type);
      for (const kind of ['events', 'actions', 'exposed', 'properties'] as const) {
        const targets = Object.values(r[kind]).map((v) => String(v).split('.')[0]);
        for (const target of targets)
          expect([type, kind, target, target in r[kind]]).toEqual([type, kind, target, false]);
      }
    }
  });
});

describe('renameEventHandler', () => {
  it('renames the event id of a Shad* source', () => {
    const out = renameEventHandler({ eventId: 'onRowClicked', actionId: 'show-alert' }, 'ShadListView', typesById);
    expect(out).toEqual({ eventId: 'onRecordClicked', actionId: 'show-alert' });
  });

  it('leaves a non-Shad source and an unmapped event alone (same object)', () => {
    const event = { eventId: 'onRowClicked', actionId: 'show-alert' };
    expect(renameEventHandler(event, 'ListView', typesById)).toBe(event);
    const other = { eventId: 'onClick', actionId: 'show-alert' };
    expect(renameEventHandler(other, 'ShadButton', typesById)).toBe(other);
  });

  it('renames a control-component action by the target type, from any source', () => {
    const out = renameEventHandler(
      {
        eventId: 'onClick',
        actionId: 'control-component',
        componentId: KANBAN_ID,
        componentSpecificActionHandle: 'updateCard',
      },
      'Button',
      typesById
    );
    expect(out.componentSpecificActionHandle).toBe('updateCardData');
    const common = renameEventHandler(
      {
        eventId: 'onClick',
        actionId: 'control-component',
        componentId: BUTTON_ID,
        componentSpecificActionHandle: 'disable',
      },
      undefined,
      typesById
    );
    expect(common.componentSpecificActionHandle).toBe('setDisable');
  });

  it('does not rename an action on a target that is not a Shad* widget', () => {
    const event = { actionId: 'control-component', componentId: 'x', componentSpecificActionHandle: 'disable' };
    expect(renameEventHandler(event, undefined, { x: 'Button' })).toBe(event);
  });
});

describe('rewriteReferences', () => {
  it('rewrites the id form the editor stores, dot and bracket', () => {
    expect(rewrite(`{{components.${LIST_ID}.selectedRow.id}}`)).toBe(`{{components.${LIST_ID}.selectedRecord.id}}`);
    expect(rewrite(`{{components["${LIST_ID}"].selectedRow}}`)).toBe(`{{components["${LIST_ID}"].selectedRecord}}`);
    expect(rewrite(`{{components?.${LIST_ID}?.selectedRow}}`)).toBe(`{{components?.${LIST_ID}?.selectedRecord}}`);
  });

  it('rewrites the name form, dot and both bracket quotes', () => {
    expect(rewrite('{{components.orders.selectedRow}}')).toBe('{{components.orders.selectedRecord}}');
    expect(rewrite("{{components['orders'].selectedRow}}")).toBe("{{components['orders'].selectedRecord}}");
    expect(rewrite('{{components["orders"]["selectedRow"]}}')).toBe('{{components["orders"]["selectedRecord"]}}');
  });

  it('keeps a list-view row index and works in plain RunJS code', () => {
    expect(rewrite('return components.orders[0].selectedRow;')).toBe('return components.orders[0].selectedRecord;');
  });

  it('requires the whole member name (selectedRowId has its own rule, never a prefix hit)', () => {
    expect(rewrite('{{components.orders.selectedRowId}}')).toBe('{{components.orders.selectedRecordId}}');
    expect(rewrite('{{components.orders.selectedRowsCount}}')).toBe('{{components.orders.selectedRowsCount}}');
  });

  it('renames actions only where called, exposed names only where not', () => {
    expect(rewrite('components.save.disable(true); components.save.loading?.(false)')).toBe(
      'components.save.setDisable(true); components.save.setLoading?.(false)'
    );
    expect(rewrite('{{components.save.disable}}')).toBe('{{components.save.disable}}');
  });

  it('inserts a path target as is', () => {
    expect(rewrite('{{components.board.movedCard.title}}')).toBe('{{components.board.lastCardMovement.card.title}}');
    expect(rewrite("{{components.board['movedCard']}}")).toBe("{{components.board['lastCardMovement']['card']}}");
  });

  it('leaves other components, other roots and look-alikes alone', () => {
    const text = '{{components.other.selectedRow + queries.orders.selectedRow + mycomponents.orders.selectedRow}}';
    expect(rewrite(text)).toBe(text);
  });

  it('leaves a name shared by two components alone, but still rewrites the id form', () => {
    const shared: string[] = [];
    const refs = buildRenamesByComponentRef(
      [
        { id: LIST_ID, name: 'orders', type: 'ShadListView' },
        { id: BUTTON_ID, name: 'orders', type: 'ListView' },
      ],
      (name) => shared.push(name)
    );
    expect(shared).toEqual(['orders']);
    expect(rewriteReferences('{{components.orders.selectedRow}}', refs)).toBe('{{components.orders.selectedRow}}');
    expect(rewriteReferences(`{{components.${LIST_ID}.selectedRow}}`, refs)).toBe(
      `{{components.${LIST_ID}.selectedRecord}}`
    );
  });

  it('is idempotent', () => {
    const text = `{{components.orders.selectedRow}} {{components.board.movedCard}} components.save.disable(1)`;
    const once = rewrite(text);
    expect(rewrite(once)).toBe(once);
  });
});

describe('renameProperties', () => {
  it('moves an old key to its new name, keeping the value object', () => {
    const value = { value: 'https://x/y.png', fxActive: false };
    const out = renameProperties({ src: value, alt: { value: 'A' } }, 'ShadImage');
    expect(out).toEqual({ source: value, alternativeText: { value: 'A' } });
    expect((out as Record<string, unknown>).source).toBe(value);
  });

  it('never overwrites a new key that is already there, and is idempotent', () => {
    const props = { src: { value: 'old' }, source: { value: 'new' } };
    expect(renameProperties(props, 'ShadImage')).toBe(props);
    const once = renameProperties({ pageSize: { value: 10 } }, 'ShadTable');
    expect(renameProperties(once, 'ShadTable')).toBe(once);
  });

  it('does nothing for a type without property renames', () => {
    const props = { src: { value: 'x' } };
    expect(renameProperties(props, 'Image')).toBe(props);
  });
});

describe('migrateFlexContainerCardStyle', () => {
  it('turns an Ant card into the shadcn card and keeps the rest of the property', () => {
    const out = migrateFlexContainerCardStyle(
      { cardStyle: { value: 'antCard', fxActive: false }, gap: { value: '12' } },
      'FlexContainer'
    );
    expect(out).toEqual({ cardStyle: { value: 'shadcnCard', fxActive: false }, gap: { value: '12' } });
  });

  it('leaves other surfaces and other types alone', () => {
    const plain = { cardStyle: { value: 'none' } };
    expect(migrateFlexContainerCardStyle(plain, 'FlexContainer')).toBe(plain);
    const other = { cardStyle: { value: 'antCard' } };
    expect(migrateFlexContainerCardStyle(other, 'Container')).toBe(other);
  });
});

describe('rewriteStringsDeep', () => {
  it('rewrites strings anywhere and keeps keys and non-strings', () => {
    const out = rewriteStringsDeep(
      { code: 'components.orders.selectedRow', list: [{ v: '{{components.orders.selectedRow}}' }, 3, null] },
      rewrite
    );
    expect(out).toEqual({
      code: 'components.orders.selectedRecord',
      list: [{ v: '{{components.orders.selectedRecord}}' }, 3, null],
    });
  });
});

describe('renameEventHandlerRow', () => {
  it('renames the event, rewrites its strings and follows the name when it was the event id', () => {
    const row = {
      id: 'e',
      name: 'onChange',
      event: { eventId: 'onChange', actionId: 'set-custom-variable', value: '{{components.orders.selectedRow}}' },
    };
    const out = renameEventHandlerRow(row, 'ShadSelect', typesById, rewrite);
    expect(out).toEqual({
      id: 'e',
      name: 'onSelect',
      event: { eventId: 'onSelect', actionId: 'set-custom-variable', value: '{{components.orders.selectedRecord}}' },
    });
    expect(renameEventHandlerRow(out, 'ShadSelect', typesById, rewrite)).toBe(out);
  });

  it('keeps a name the builder chose', () => {
    const out = renameEventHandlerRow(
      { name: 'Pick', event: { eventId: 'onChange' } },
      'ShadSelect',
      typesById,
      rewrite
    );
    expect(out.name).toBe('Pick');
  });
});

describe('applyUi2RenamesToImport', () => {
  const page = { id: 'p1', appVersionId: 'v1' };

  it('renames events, actions, references and properties in place', () => {
    const data = {
      pages: [page],
      components: [
        { id: SELECT_ID, name: 'status', type: 'ShadSelect', pageId: 'p1', properties: {} },
        { id: 'img', name: 'logo', type: 'ShadImage', pageId: 'p1', properties: { src: { value: 'x' } } },
        {
          id: 'txt',
          name: 'label',
          type: 'Text',
          pageId: 'p1',
          properties: { text: { value: `{{components.${LIST_ID}.selectedRow}}` } },
        },
        { id: LIST_ID, name: 'orders', type: 'ShadListView', pageId: 'p1', properties: {} },
      ],
      events: [
        {
          id: 'e1',
          name: 'onChange',
          index: 0,
          sourceId: SELECT_ID,
          appVersionId: 'v1',
          event: { eventId: 'onChange' },
        },
        {
          id: 'e2',
          name: 'onClick',
          index: 0,
          sourceId: 'q',
          appVersionId: 'v1',
          event: {
            eventId: 'onClick',
            actionId: 'control-component',
            componentId: KANBAN_ID,
            componentSpecificActionHandle: 'disable',
          },
        },
      ],
      dataQueries: [{ id: 'q', appVersionId: 'v1', options: { code: 'return components.orders.selectedRow' } }],
    };
    const events = data.events;
    applyUi2RenamesToImport(data);
    expect(data.events).toBe(events);
    expect(data.events.map((e) => [e.id, e.name, e.event.eventId])).toEqual([
      ['e1', 'onSelect', 'onSelect'],
      ['e2', 'onClick', 'onClick'],
    ]);
    // KANBAN_ID is not in this app, so the action on it is left alone.
    expect(data.events[1].event.componentSpecificActionHandle).toBe('disable');
    expect(data.components[1].properties).toEqual({ source: { value: 'x' } });
    expect(data.components[2].properties.text.value).toBe(`{{components.${LIST_ID}.selectedRecord}}`);
    expect(data.dataQueries[0].options.code).toBe('return components.orders.selectedRecord');
  });

  it('migrates Ant cards even in an app with no Shad* widget, and is a no-op otherwise', () => {
    const data = {
      pages: [page],
      components: [
        { id: 'f', name: 'card', type: 'FlexContainer', pageId: 'p1', properties: { cardStyle: { value: 'antCard' } } },
      ],
      events: [{ id: 'e', sourceId: 'f', appVersionId: 'v1', event: { eventId: 'onChange' } }],
    };
    applyUi2RenamesToImport(data);
    expect(data.components[0].properties.cardStyle.value).toBe('shadcnCard');
    expect(data.events[0].event.eventId).toBe('onChange');
  });

  // Audit 35: a layout-visibility binding (Show on desktop / mobile) lives in displayPreferences, which the rewrite
  // skipped, so `components.tags1.tags` kept the retired name and the widget was hidden.
  it('[UI2-IMPORT-035] rewrites references in display preferences', () => {
    const data = {
      pages: [page],
      components: [
        { id: 'tags-id', name: 'tags1', type: 'ShadTagsInput', pageId: 'p1', properties: {} },
        {
          id: 'txt',
          name: 'label',
          type: 'Text',
          pageId: 'p1',
          properties: {},
          displayPreferences: {
            showOnDesktop: { value: '{{(components.tags1.tags || []).length > 0}}' },
            showOnMobile: { value: '{{true}}' },
          },
        },
      ],
    };
    applyUi2RenamesToImport(data);
    expect(data.components[1].displayPreferences).toEqual({
      showOnDesktop: { value: '{{(components.tags1.values || []).length > 0}}' },
      showOnMobile: { value: '{{true}}' },
    });
  });

  // Audit 36: the reference lookup was a plain object, so `components.constructor` found Object.prototype.constructor
  // and reading its rename table threw. Plain text naming any inherited member must pass through untouched.
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf'])(
    '[UI2-IMPORT-036] leaves text naming components.%s alone',
    (name) => {
      const text = `Example: components.${name}.name and components['${name}'].value`;
      const data = {
        pages: [page],
        components: [
          { id: 'tags-id', name: 'tags1', type: 'ShadTagsInput', pageId: 'p1', properties: {} },
          { id: 'txt', name: 'text1', type: 'Text', pageId: 'p1', properties: { text: { value: text } } },
        ],
        dataQueries: [{ id: 'q', appVersionId: 'v1', options: { code: `return ${text}` } }],
      };
      expect(() => applyUi2RenamesToImport(data)).not.toThrow();
      expect(data.components[1].properties).toEqual({ text: { value: text } });
      expect(data.dataQueries[0].options.code).toBe(`return ${text}`);
    }
  );
});
