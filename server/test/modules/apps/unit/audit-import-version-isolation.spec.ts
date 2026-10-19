/**
 * Import rename, per version: an event handler is renamed with its own version's components only. An export carries
 * each handler's appVersionId; one without it is placed by its source (a component, page or query), and left alone when
 * that is unknown, rather than renamed by every version's names.
 *
 * Adopted from the release audit evidence (repros/integrated/reviewImportVersionIsolation.spec.ts, 18 Oct), import path
 * adapted.
 */
import { applyUi2RenamesToImport } from '@modules/apps/services/ui2-legacy-names';

const LEGACY = '{{components.subject.tags}}';
const MODERN = '{{components.subject.values}}';

// Two versions with a component of the same name: a UI 2.0 Tags input in `new`, the native one in `old`.
const fixture = (reverse: boolean, withVersion: boolean, extraEvents: Array<Record<string, any>> = []) => {
  const components: Array<Record<string, any>> = [
    {
      id: 'new-id',
      name: 'subject',
      type: 'ShadTagsInput',
      pageId: 'new-page',
      properties: { note: { value: LEGACY } },
    },
    { id: 'old-id', name: 'subject', type: 'TagsInput', pageId: 'old-page', properties: { note: { value: LEGACY } } },
  ];
  if (reverse) components.reverse();
  const event = (sourceId: string, version: string) => ({
    sourceId,
    ...(withVersion ? { appVersionId: version } : {}),
    name: 'onChange',
    event: { eventId: 'onChange', actionId: 'set-variable', key: 'seen', value: LEGACY },
  });
  return {
    pages: [
      { id: 'new-page', appVersionId: 'new' },
      { id: 'old-page', appVersionId: 'old' },
    ],
    components,
    events: [event('new-id', 'new'), event('old-id', 'old'), ...extraEvents],
    dataQueries: [
      { id: 'new-q', appVersionId: 'new', options: { code: 'return components.subject.tags;' } },
      { id: 'old-q', appVersionId: 'old', options: { code: 'return components.subject.tags;' } },
    ],
  };
};

test.each([
  [false, true],
  [true, true],
  [false, false],
  [true, false],
])('each version renames its own rows (reversed %s, handler versions given %s)', (reverse, withVersion) => {
  const data = fixture(reverse, withVersion);
  applyUi2RenamesToImport(data);
  expect(data.components.find((c) => c.id === 'new-id').properties.note.value).toBe(MODERN);
  expect(data.components.find((c) => c.id === 'old-id').properties.note.value).toBe(LEGACY);
  expect(data.dataQueries.map((q) => q.options.code)).toEqual([
    'return components.subject.values;',
    'return components.subject.tags;',
  ]);
  expect(data.events.map((e) => e.event.value)).toEqual([MODERN, LEGACY]);
});

test('a handler without a version is placed by its page or query, and left alone when its source is unknown', () => {
  const handler = (sourceId: string) => ({
    sourceId,
    name: 'onLoad',
    event: { eventId: 'onLoad', actionId: 'set-variable', key: 'seen', value: LEGACY },
  });
  const data = fixture(false, true, [handler('new-page'), handler('old-page'), handler('new-q'), handler('nowhere')]);
  applyUi2RenamesToImport(data);
  expect(data.events.slice(2).map((e) => e.event.value)).toEqual([MODERN, LEGACY, MODERN, LEGACY]);
});
