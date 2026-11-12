import { InMemoryCacheService } from '@modules/inMemoryCache/in-memory-cache.service';

/** @group platform */
describe('InMemoryCacheService', () => {
  const cache = new InMemoryCacheService();
  let now: number;

  beforeEach(() => {
    cache.clear();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => jest.restoreAllMocks());

  it('expires an entry set without a ttl after the 5-minute default', () => {
    cache.set('oauth_code', Promise.resolve('token'));

    now += 5 * 60_000;
    expect(cache.has('oauth_code')).toBe(true);

    now += 1;
    expect(cache.has('oauth_code')).toBe(false);
  });

  it('keeps an explicit ttl', () => {
    cache.set('license', Promise.resolve({}), 30_000);

    now += 30_001;
    expect(cache.has('license')).toBe(false);
  });

  it('drops the oldest entry once 1000 entries are stored', () => {
    for (let i = 0; i < 1000; i++) cache.set(`key_${i}`, Promise.resolve(i));

    cache.set('key_1000', Promise.resolve(1000));

    expect(cache.has('key_0')).toBe(false);
    expect(cache.has('key_1')).toBe(true);
    expect(cache.has('key_1000')).toBe(true);
  });

  it('treats a re-set key as newest', () => {
    for (let i = 0; i < 1000; i++) cache.set(`key_${i}`, Promise.resolve(i));

    cache.set('key_0', Promise.resolve('fresh'));
    cache.set('key_1000', Promise.resolve(1000));

    expect(cache.has('key_0')).toBe(true);
    expect(cache.has('key_1')).toBe(false);
  });
});
