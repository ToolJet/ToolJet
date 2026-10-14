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
    events: [
      {
        id: 'e1',
        sourceId: 'c1',
        target: 'component',
        index: 0,
        eventId: 'onClick',
        actionId: 'run-query',
        refId: 'q1',
      },
      { id: 'e2', sourceId: 'c1', target: 'component', index: 1, eventId: 'onClick', actionId: 'show-alert' },
    ],
    dataSources: [{ id: 'ds1', kind: 'postgresql', scope: 'global', organizationId: 'org1' }],
    homePageId: 'p1',
  });

  it('looks up components, pages and queries', () => {
    expect(index.component('c2')?.name).toBe('button2');
    expect(index.componentsOnPage('p1').map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(index.page('p2')?.handle).toBe('other');
    expect(index.queriesNamed('getUsers').map((q) => q.id)).toEqual(['q1']);
    expect(index.homePageId).toBe('p1');
  });

  it('looks up events and data sources', () => {
    expect(index.event('e1')?.refId).toBe('q1');
    expect(index.eventsForSource('c1').map((e) => e.id)).toEqual(['e1', 'e2']);
    expect(index.events()).toHaveLength(2);
    expect(index.dataSource('ds1')?.kind).toBe('postgresql');
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
    // The copy keeps the rest of the lookup.
    expect(next.event('e1')?.actionId).toBe('run-query');
    expect(next.dataSource('ds1')?.kind).toBe('postgresql');
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
        .mockResolvedValueOnce([{ id: 'q1', name: 'q', dataSourceId: 'ds1' }])
        .mockResolvedValueOnce([
          {
            id: 'e1',
            sourceId: 'c1',
            target: 'component',
            index: 0,
            event: { eventId: 'onClick', actionId: 'run-query', queryId: 'q1' },
          },
        ])
        .mockResolvedValueOnce([{ id: 'ds1', kind: 'postgresql', scope: 'global', organizationId: 'org1' }]),
      findOne: jest.fn().mockResolvedValue({ id: 'v1', homePageId: 'p1' }),
    };

    const loaded = await VersionIndex.load(manager, 'v1');

    expect(queryBuilder.where).toHaveBeenCalledWith('page.appVersionId = :appVersionId', { appVersionId: 'v1' });
    expect(loaded.component('c1')?.name).toBe('button1');
    expect(loaded.page('p1')?.handle).toBe('home');
    expect(loaded.query('q1')?.name).toBe('q');
    expect(loaded.homePageId).toBe('p1');
    // The event's action reference is resolved into refId while loading.
    expect(loaded.event('e1')).toMatchObject({ eventId: 'onClick', actionId: 'run-query', refId: 'q1' });
    expect(loaded.dataSource('ds1')?.kind).toBe('postgresql');
  });
});
