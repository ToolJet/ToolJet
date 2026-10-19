/**
 * The UI 2.0 rename data migration, run against an in-memory set of tables through a fake query runner (no database).
 * Release audit 2026-10-17: display preferences were not rewritten (35), plain text naming an inherited object member
 * threw (36), and undo/redo history was cleared only for versions whose current rows changed, so restoring an older
 * entry brought retired names back (45).
 */
import { RenameUi2PackNames1792158590141 as Migration } from '../../../../data-migrations/1792158590141-RenameUi2PackNames';

const cleared: string[][] = [];
jest.mock('@helpers/migration.helper', () => ({
  MigrationProgress: class {
    show() {}
  },
  deleteAppHistoryForStructuralMigration: async (_manager: unknown, options: { appVersionIds: string[] }) => {
    cleared.push([...options.appVersionIds].sort());
  },
}));

type Row = Record<string, any>;
interface Tables {
  pages: Row[];
  components: Row[];
  event_handlers?: Row[];
  data_queries?: Row[];
  app_history?: Row[];
}

/** Postgres' jsonb text form (`{"a": 1, "b": [2, 3]}`), which `change_payload::text` produces. */
const jsonbText = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(jsonbText).join(', ')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .map(([k, v]) => `${JSON.stringify(k)}: ${jsonbText(v)}`)
      .join(', ')}}`;
  return JSON.stringify(value);
};

function fakeQueryRunner(tables: Tables) {
  const versionOf = (component: Row) => tables.pages.find((p) => p.id === component.page_id)?.app_version_id;
  const shadVersions = () =>
    [...new Set(tables.components.filter((c) => c.type.startsWith('Shad')).map(versionOf))].sort();
  const query = jest.fn(async (sql: string, params: any[] = []) => {
    if (/FROM app_history/.test(sql)) {
      const [since, ...patterns] = params;
      const versions = (tables.app_history ?? [])
        .filter((h) => new Date(h.created_at) >= new Date(since))
        .filter((h) => patterns.some((p: string) => new RegExp(p).test(jsonbText(h.change_payload))))
        .map((h) => h.app_version_id);
      return [...new Set(versions)].map((app_version_id) => ({ app_version_id }));
    }
    if (/c\.type = 'FlexContainer'/.test(sql))
      return tables.components
        .filter((c) => c.type === 'FlexContainer' && JSON.stringify(c.properties).includes('antCard'))
        .map((c) => ({ id: c.id, properties: c.properties, app_version_id: versionOf(c) }));
    if (/SELECT COUNT\(DISTINCT/.test(sql)) return [{ count: String(shadVersions().length) }];
    if (/SELECT DISTINCT p\.app_version_id/.test(sql)) {
      const [limit, offset] = params;
      return shadVersions()
        .slice(offset, offset + limit)
        .map((app_version_id) => ({ app_version_id }));
    }
    if (/SELECT c\.id, c\.name, c\.type/.test(sql)) {
      const columns = sql
        .match(/SELECT ([\s\S]*?)\s+FROM/)[1]
        .split(',')
        .map((c) => c.trim().replace(/^c\./, ''));
      return tables.components
        .filter((c) => versionOf(c) === params[0])
        .map((c) => Object.fromEntries(columns.map((col) => [col, c[col] ?? null])));
    }
    if (/^UPDATE components SET/.test(sql)) {
      const columns = [...sql.split(' WHERE ')[0].matchAll(/(\w+) = \$\d+/g)].map((m) => m[1]);
      const id = params[params.length - 1];
      const row = tables.components.find((c) => c.id === id);
      columns.forEach((col, i) => (row[col] = JSON.parse(params[i])));
      return [];
    }
    if (/FROM event_handlers/.test(sql))
      return (tables.event_handlers ?? []).filter((h) => h.app_version_id === params[0]);
    if (/^UPDATE event_handlers/.test(sql)) {
      const row = tables.event_handlers.find((h) => h.id === params[2]);
      Object.assign(row, { name: params[0], event: JSON.parse(params[1]) });
      return [];
    }
    if (/FROM data_queries/.test(sql)) return (tables.data_queries ?? []).filter((q) => q.app_version_id === params[0]);
    if (/^UPDATE data_queries/.test(sql)) {
      tables.data_queries.find((q) => q.id === params[1]).options = JSON.parse(params[0]);
      return [];
    }
    throw new Error(`unexpected query: ${sql}`);
  });
  return { queryRunner: { query, manager: { query } } as any, query };
}

const component = (id: string, type: string, pageId: string, extra: Row = {}): Row => ({
  id,
  name: id,
  type,
  page_id: pageId,
  properties: {},
  general_properties: null,
  styles: {},
  general_styles: null,
  display_preferences: null,
  validation: {},
  ...extra,
});
const RECENT = '2026-10-16T10:00:00Z';

describe('RenameUi2PackNames data migration', () => {
  beforeEach(() => {
    cleared.length = 0;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('[UI2-MIG-035] rewrites references in display preferences', async () => {
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [
        component('tags1', 'ShadTagsInput', 'p1'),
        component('text1', 'Text', 'p1', {
          display_preferences: {
            showOnDesktop: { value: '{{(components.tags1.tags || []).length > 0}}' },
            showOnMobile: { value: false },
          },
        }),
      ],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    expect(tables.components[1].display_preferences).toEqual({
      showOnDesktop: { value: '{{(components.tags1.values || []).length > 0}}' },
      showOnMobile: { value: false },
    });
  });

  it('[UI2-MIG-036] leaves plain text naming an inherited member alone', async () => {
    const text = 'Example: components.constructor.name, components.toString.name, components.__proto__.name';
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [
        component('tags1', 'ShadTagsInput', 'p1'),
        component('text1', 'Text', 'p1', { properties: { text: { value: text } } }),
      ],
      data_queries: [{ id: 'q1', app_version_id: 'v1', options: { code: `return '${text}'` } }],
    };
    await expect(new Migration().up(fakeQueryRunner(tables).queryRunner)).resolves.toBeUndefined();
    expect(tables.components[1].properties).toEqual({ text: { value: text } });
    expect(tables.data_queries[0].options.code).toBe(`return '${text}'`);
  });

  it('[UI2-MIG-045] clears history for every version with a UI 2.0 widget, now or in its history', async () => {
    const tables: Tables = {
      pages: ['a', 'b', 'c', 'd', 'e'].map((v) => ({ id: `p-${v}`, app_version_id: v })),
      components: [
        // a: the Image already uses `source` (nothing to rewrite now); an older snapshot holds `src`.
        component('img', 'ShadImage', 'p-a', { properties: { source: { value: 'x.png' } } }),
        // b: the Image was deleted; only history remembers it.
        component('txt-b', 'Text', 'p-b'),
        // c: the card is already the shadcn card; an older snapshot holds the removed Ant card.
        component('card', 'FlexContainer', 'p-c', { properties: { cardStyle: { value: 'shadcnCard' } } }),
        // d: native widgets only, with a box shadow; e: native only.
        component('txt-d', 'Text', 'p-d', { styles: { boxShadow: { value: '0 0 4px' } } }),
        component('txt-e', 'Text', 'p-e'),
      ],
      app_history: [
        {
          app_version_id: 'a',
          created_at: RECENT,
          change_payload: { components: [{ id: 'img', type: 'ShadImage', properties: { src: { value: 'x.png' } } }] },
        },
        {
          app_version_id: 'b',
          created_at: RECENT,
          change_payload: { entity: 'components', op: 'create', data: { id: 'img2', type: 'ShadImage' } },
        },
        {
          app_version_id: 'c',
          created_at: RECENT,
          change_payload: {
            components: [{ id: 'card', type: 'FlexContainer', properties: { cardStyle: { value: 'antCard' } } }],
          },
        },
        {
          app_version_id: 'd',
          created_at: RECENT,
          change_payload: { components: [{ id: 'txt-d', type: 'Text', styles: { boxShadow: { value: 'Shadow' } } }] },
        },
        { app_version_id: 'e', created_at: RECENT, change_payload: { components: [{ id: 'txt-e', type: 'Text' }] } },
      ],
    };
    const { query } = fakeQueryRunner(tables);
    await new Migration().up({ query, manager: { query } } as any);
    expect(cleared).toEqual([['a', 'b', 'c']]);
    // Restoring is what brought the old names back; the current rows themselves needed no rewrite.
    expect(tables.components[0].properties).toEqual({ source: { value: 'x.png' } });
    // One bounded read of the history table: UI 2.0 types did not exist before the cutoff it passes.
    const historyReads = query.mock.calls.filter(([sql]) => /FROM app_history/.test(sql));
    expect(historyReads).toHaveLength(1);
    expect(historyReads[0][0]).toMatch(/created_at >= \$1/);
  });

  // Release audit round 2: the migration's rewrite read the code too (see ui2-legacy-names.spec UI2-IMPORT-401/402).
  it('[UI2-MIG-401] rewrites references by the code and leaves literal text alone', async () => {
    const code = "const t = components.tags1 // the field\n  .tags;\nreturn [t, 'components.tags1.tags'];";
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [
        component('tags1', 'ShadTagsInput', 'p1'),
        component('text1', 'Text', 'p1', {
          properties: {
            text: { value: 'Count: {{components.tags1 /* c */ .tags.length}} (see components.tags1.tags)' },
          },
        }),
      ],
      data_queries: [{ id: 'q1', app_version_id: 'v1', options: { code } }],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    expect(tables.components[1].properties.text.value).toBe(
      'Count: {{components.tags1 /* c */ .values.length}} (see components.tags1.tags)'
    );
    expect(tables.data_queries[0].options.code).toBe(
      "const t = components.tags1 // the field\n  .values;\nreturn [t, 'components.tags1.tags'];"
    );
  });

  it('[UI2-MIG-402] keeps an own __proto__ key in a rewritten payload', async () => {
    const properties = JSON.parse('{"__proto__": {"value": "kept"}, "text": {"value": "{{components.tags1.tags}}"}}');
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [component('tags1', 'ShadTagsInput', 'p1'), component('text1', 'Text', 'p1', { properties })],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    const out = tables.components[1].properties;
    expect(Object.keys(out)).toEqual(['__proto__', 'text']);
    expect(out.text.value).toBe('{{components.tags1.values}}');
  });

  // Release audit 2026-10-18 (reviewFrozenMigrationRewrite, reviewAssemblyFrozenMigrationRewrite,
  // review-legacy-references, reviewDialogRenameTarget): a string in parentheses or before a comment was renamed as if
  // it were code, and so was a local `components`; a widget read through a List view row was missed; and a Dialog's
  // `disable` became `setDisable`, which the Dialog never had.
  it('[UI2-MIG-403] leaves strings and a local `components` alone', async () => {
    const texts = [
      '{{ ("components.tags1.tags") }}',
      '{{ "components.tags1.tags" /* text */ }}',
      '{{ ("components.tags1.tags" + components.tags1.tags.length) }}',
    ];
    const code = 'function read(components) { return components.tags1.tags; }\nreturn components.tags1.tags;';
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [
        component('tags1', 'ShadTagsInput', 'p1'),
        ...texts.map((value, i) => component(`text${i}`, 'Text', 'p1', { properties: { text: { value } } })),
      ],
      data_queries: [{ id: 'q1', app_version_id: 'v1', options: { code } }],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    expect(tables.components.slice(1).map((c) => c.properties.text.value)).toEqual([
      '{{ ("components.tags1.tags") }}',
      '{{ "components.tags1.tags" /* text */ }}',
      '{{ ("components.tags1.tags" + components.tags1.values.length) }}',
    ]);
    expect(tables.data_queries[0].options.code).toBe(
      'function read(components) { return components.tags1.tags; }\nreturn components.tags1.values;'
    );
  });

  it('[UI2-MIG-404] renames a widget read through a List view row', async () => {
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [
        component('list1', 'ShadListView', 'p1'),
        component('tags1', 'ShadTagsInput', 'p1'),
        component('text1', 'Text', 'p1', {
          properties: { text: { value: '{{components.list1.children[listItem.index].tags1.tags}}' } },
        }),
      ],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    expect(tables.components[2].properties.text.value).toBe(
      '{{components.list1.children[listItem.index].tags1.values}}'
    );
  });

  it('[UI2-MIG-405] leaves a Dialog `disable` alone, and still renames its other control actions', async () => {
    const handler = (id: string, handle: string) => ({
      id,
      name: 'onClick',
      source_id: 'button1',
      app_version_id: 'v1',
      event: {
        eventId: 'onClick',
        actionId: 'control-component',
        componentId: 'dialog1',
        componentSpecificActionHandle: handle,
      },
    });
    const tables: Tables = {
      pages: [{ id: 'p1', app_version_id: 'v1' }],
      components: [component('dialog1', 'ShadDialog', 'p1'), component('button1', 'ShadButton', 'p1')],
      event_handlers: [handler('h1', 'disable'), handler('h2', 'visibility')],
      data_queries: [{ id: 'q1', app_version_id: 'v1', options: { code: 'components.dialog1.disable(true);' } }],
    };
    await new Migration().up(fakeQueryRunner(tables).queryRunner);
    expect(tables.event_handlers.map((h) => h.event.componentSpecificActionHandle)).toEqual([
      'disable',
      'setVisibility',
    ]);
    expect(tables.data_queries[0].options.code).toBe('components.dialog1.disable(true);');
  });
});
