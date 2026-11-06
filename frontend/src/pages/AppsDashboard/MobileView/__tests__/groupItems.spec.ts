import { groupItems } from '../helpers/groupItems';
import { makeApp, makeFolder, makePage } from './fixtures';

describe('groupItems', () => {
  test('splits pinned items, folders and apps, keeping page order within each', () => {
    const page = makePage([
      makeApp('p1', { pinned: true }),
      makeFolder('pf', { pinned: true }),
      makeFolder('f1'),
      makeApp('a1'),
      makeFolder('f2'),
    ]);

    const { pinned, folders, apps } = groupItems([page]);

    expect(pinned.map((i) => i.id)).toEqual(['p1', 'pf']);
    expect(folders.map((i) => i.id)).toEqual(['f1', 'f2']);
    expect(apps.map((i) => i.id)).toEqual(['a1']);
  });

  test('flattens every loaded page in order', () => {
    const pages = [makePage([makeApp('a1'), makeApp('a2')]), makePage([makeApp('a3')], { page: 2 })];

    expect(groupItems(pages).apps.map((i) => i.id)).toEqual(['a1', 'a2', 'a3']);
  });

  test('lists a folder holding a pinned app under Pinned', () => {
    const { pinned, folders } = groupItems([makePage([makeFolder('f1', { has_pinned_apps: true })])]);

    expect(pinned.map((i) => i.id)).toEqual(['f1']);
    expect(folders).toEqual([]);
  });

  test('keeps only items with the pinned flag under Pinned while editing', () => {
    const page = makePage([makeApp('p1', { pinned: true }), makeFolder('f1', { has_pinned_apps: true })]);

    const { pinned, folders } = groupItems([page], { editing: true });

    expect(pinned.map((i) => i.id)).toEqual(['p1']);
    expect(folders.map((i) => i.id)).toEqual(['f1']);
  });

  test('drops an item that appears on two pages', () => {
    const pages = [makePage([makeApp('a1'), makeApp('a2')]), makePage([makeApp('a2'), makeApp('a3')], { page: 2 })];

    expect(groupItems(pages).apps.map((i) => i.id)).toEqual(['a1', 'a2', 'a3']);
  });

  test('treats an app and a folder sharing an id as different items', () => {
    const { folders, apps } = groupItems([makePage([makeFolder('x'), makeApp('x')])]);

    expect(folders).toHaveLength(1);
    expect(apps).toHaveLength(1);
  });
});
