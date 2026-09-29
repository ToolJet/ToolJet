import { VersionIndex } from '@modules/app-validation/version-index';

const component = (id: string, name: string, pageId = 'p1', parent: string | null = null) => ({
  id,
  name,
  type: 'Button',
  parent,
  pageId,
});

describe('VersionIndex', () => {
  const index = VersionIndex.fromData({
    components: [component('c1', 'button1'), component('c2', 'button2'), component('c3', 'button1', 'p2')],
    pages: [
      { id: 'p1', name: 'Home', handle: 'home' },
      { id: 'p2', name: 'Other', handle: 'other' },
    ],
    queries: [{ id: 'q1', name: 'getUsers' }],
    homePageId: 'p1',
  });

  it('looks up components, pages and queries', () => {
    expect(index.component('c2')?.name).toBe('button2');
    expect(index.componentsOnPage('p1').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(index.page('p2')?.handle).toBe('other');
    expect(index.queriesNamed('getUsers').map((q) => q.id)).toEqual(['q1']);
    expect(index.homePageId).toBe('p1');
  });

  it('checks names per page, and can ignore the components being renamed', () => {
    expect(index.isComponentNameTaken('p1', 'button1')).toBe(true);
    expect(index.isComponentNameTaken('p1', 'button1', ['c1'])).toBe(false);
    expect(index.isComponentNameTaken('p1', 'button3')).toBe(false);
  });

  it('adds components created in the same request without changing the original', () => {
    const next = index.withComponents([component('c4', 'container1'), { ...component('c2', 'renamed'), pageId: 'p1' }]);
    expect(next.component('c4')?.name).toBe('container1');
    expect(next.component('c2')?.name).toBe('renamed');
    expect(index.component('c4')).toBeUndefined();
    expect(index.component('c2')?.name).toBe('button2');
  });

  it('loads from the database with small queries through the given EntityManager', async () => {
    const queryBuilder: any = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([component('c1', 'button1')]),
    };
    const manager: any = {
      createQueryBuilder: jest.fn(() => queryBuilder),
      find: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'p1', handle: 'home' }])
        .mockResolvedValueOnce([{ id: 'q1', name: 'q' }]),
      findOne: jest.fn().mockResolvedValue({ id: 'v1', homePageId: 'p1' }),
    };

    const loaded = await VersionIndex.load(manager, 'v1');

    expect(queryBuilder.where).toHaveBeenCalledWith('page.appVersionId = :appVersionId', { appVersionId: 'v1' });
    expect(loaded.component('c1')?.name).toBe('button1');
    expect(loaded.page('p1')?.handle).toBe('home');
    expect(loaded.query('q1')?.name).toBe('q');
    expect(loaded.homePageId).toBe('p1');
  });
});
