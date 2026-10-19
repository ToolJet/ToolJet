// Release audit 2026-10-18 (Codex fixture reviewMetadataGuardBoundaries): the compat guard took a removed name as
// migrated when any migration's text held the pair anywhere (`onChange: 'onSelect'`), another widget's entry or a
// comment included. A rename now counts only in the widget's own entry of a migration's table (or the common one).
import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import fs from 'fs';
import path from 'path';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { classify, contractOf, diffContract } from '@/AppBuilder/Widgets/Ui2/__tests__/compat/contract';

const MIGRATION = fs.readFileSync(
  path.resolve(__dirname, '../../../../../../server/data-migrations/1792158590141-RenameUi2PackNames.ts'),
  'utf8'
);
const copy = (type) => JSON.parse(JSON.stringify(shadcnConfigs.find((c) => c.name === type)));

const AREAS = { events: 'events', actions: 'actions', exposed: 'exposedVariables' };
const without = (map, ...keys) => Object.fromEntries(Object.entries(map || {}).filter(([k]) => !keys.includes(k)));

/**
 * The guard's verdict when a release renames `from` to `to` in one area of `type`: the frozen contract has `from`, the
 * live config `to` (or neither, with `live: false`), and legacyNames maps `from` to `to`.
 */
const verdict = (
  texts,
  { type = 'ShadInput', area = 'events', from = 'onChange', to = 'onSelect', live = true } = {}
) => {
  const before = copy(type);
  const after = copy(type);
  if (area === 'actions') {
    const action = before.actions.find((a) => a.handle === to || a.handle === from) ?? { handle: from, params: [] };
    const rest = before.actions.filter((a) => a.handle !== to && a.handle !== from);
    before.actions = [...rest, { ...action, handle: from }];
    after.actions = live ? [...rest, { ...action, handle: to }] : rest;
  } else {
    const key = AREAS[area];
    const value = before[key]?.[to] ?? before[key]?.[from] ?? {};
    before[key] = { ...without(before[key], to, from), [from]: value };
    after[key] = { ...without(after[key], to, from), ...(live ? { [to]: value } : {}) };
  }
  const renames = { events: {}, actions: {}, exposed: {}, properties: {}, [area]: { [from]: to } };
  return classify(diffContract(contractOf(before), contractOf(after)), {
    renamesFor: () => renames,
    migrationTexts: texts,
    acceptedBreaks: [],
    liveContracts: { [type]: contractOf(after) },
  }).find((c) => c.change === 'removed').verdict;
};

test('another widget’s entry in a migration does not cover a new rename', () => {
  expect(MIGRATION).toContain("onChange: 'onSelect'");
  expect(MIGRATION).not.toContain('ShadInput');
  expect(verdict([MIGRATION])).toBe('break');
});

test('a comment is not a migration', () => {
  expect(verdict(["// TODO: onChange: 'onSelect', no implementation"])).toBe('break');
  expect(verdict(["/* const RENAMES = { ShadInput: { events: { onChange: 'onSelect' } } }; */"])).toBe('break');
});

test('the pair under another table of the widget’s entry does not count', () => {
  expect(verdict(["const RENAMES = { ShadInput: { actions: { onChange: 'onSelect' } } };"])).toBe('break');
});

test.each([
  ['an entry of its own', "const RENAMES = { ShadInput: { events: { onChange: 'onSelect' } } };"],
  ['a shared table', "const PICK = { events: { onChange: 'onSelect' } };\nconst RENAMES = { ShadInput: PICK };"],
  ['a spread table', "const PICK = { events: { onChange: 'onSelect' } };\nconst RENAMES = { ShadInput: { ...PICK } };"],
])('the widget’s own entry is a migration: %s', (_, text) => {
  expect(verdict([text])).toBe('renamed');
});

test.each([
  ['an entry of its own', { type: 'ShadSelect' }],
  ['a shared table', { type: 'ShadAreaChart', area: 'exposed', from: 'clickedDatum', to: 'clickedDataPoint' }],
  ['a spread table', { type: 'ShadDateTimePicker' }],
  ['the common actions', { type: 'ShadButton', area: 'actions', from: 'disable', to: 'setDisable' }],
])('the shipped migration still covers its renames: %s', (_, rename) => {
  expect(verdict([MIGRATION], rename)).toBe('renamed');
});

test('a rename to a name the widget does not have is not a migration (control)', () => {
  expect(verdict(["const RENAMES = { ShadInput: { events: { onChange: 'onSelect' } } };"], { live: false })).toBe(
    'break'
  );
});
