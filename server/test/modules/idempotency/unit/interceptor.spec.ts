import { Observable, of, throwError, lastValueFrom } from 'rxjs';
import { BadRequestException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { IdempotencyInterceptor } from '@modules/idempotency/interceptor';

class FakeRedis {
  store = new Map<string, string>();
  async set(key: string, val: string, _ex: 'EX', _ttl: number, nx?: 'NX') {
    if (nx && this.store.has(key)) return null;
    this.store.set(key, val);
    return 'OK';
  }
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async del(key: string) {
    return this.store.delete(key) ? 1 : 0;
  }
}

const KEY = '3b241101-e2bb-4255-8caf-4136c566a962';
const ctx = (over: Partial<{ key: any; userId: string; body: any; query: any }> = {}) => {
  const req = {
    headers: over.key === undefined ? {} : { 'idempotency-key': over.key },
    user: { id: over.userId ?? 'u1', organizationId: 'o1' },
    method: 'POST',
    route: { path: '/api/apps/:id/versions' },
    params: { id: 'a1' },
    query: over.query ?? {},
    body: over.body ?? { versionName: 'v2' },
  };
  return { switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({}) }) } as any;
};
const run = (i: IdempotencyInterceptor, c: any, handler: jest.Mock) =>
  lastValueFrom(i.intercept(c, { handle: handler }));

describe('IdempotencyInterceptor', () => {
  let redis: FakeRedis;
  let interceptor: IdempotencyInterceptor;
  beforeEach(() => {
    redis = new FakeRedis();
    interceptor = new IdempotencyInterceptor({ getClient: () => redis } as any);
  });

  it('passes through when no header is sent', async () => {
    const h = jest.fn(() => of({ ok: 1 }));
    await expect(run(interceptor, ctx(), h)).resolves.toEqual({ ok: 1 });
    expect(redis.store.size).toBe(0);
  });

  it('rejects a non-UUID key with 400', () => {
    expect(() => interceptor.intercept(ctx({ key: 'nope' }), { handle: jest.fn() })).toThrow(BadRequestException);
  });

  it('replays the stored body without re-running the handler', async () => {
    const h = jest.fn(() => of({ enqueued: true }));
    await run(interceptor, ctx({ key: KEY }), h);
    await expect(run(interceptor, ctx({ key: KEY }), h)).resolves.toEqual({ enqueued: true });
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('returns 422 when the key is reused with a different body', async () => {
    await run(
      interceptor,
      ctx({ key: KEY }),
      jest.fn(() => of({}))
    );
    await expect(run(interceptor, ctx({ key: KEY, body: { versionName: 'other' } }), jest.fn())).rejects.toBeInstanceOf(
      UnprocessableEntityException
    );
  });

  it('returns 422 when the key is reused with a different query', async () => {
    await run(
      interceptor,
      ctx({ key: KEY, query: { branchId: 'b1' } }),
      jest.fn(() => of({}))
    );
    await expect(run(interceptor, ctx({ key: KEY, query: { branchId: 'b2' } }), jest.fn())).rejects.toBeInstanceOf(
      UnprocessableEntityException
    );
  });

  it('returns 409 while the first request is still pending', async () => {
    // first request's handler never emits, so its key stays 'pending'
    const first = interceptor.intercept(ctx({ key: KEY }), { handle: () => new Observable(() => {}) }).subscribe();
    await new Promise((r) => setImmediate(r));
    await expect(run(interceptor, ctx({ key: KEY }), jest.fn())).rejects.toBeInstanceOf(ConflictException);
    first.unsubscribe();
  });

  it('frees the key when the handler errors so a retry runs', async () => {
    await expect(
      run(
        interceptor,
        ctx({ key: KEY }),
        jest.fn(() => throwError(() => new Error('boom')))
      )
    ).rejects.toThrow('boom');
    const h = jest.fn(() => of({ ok: 2 }));
    await expect(run(interceptor, ctx({ key: KEY }), h)).resolves.toEqual({ ok: 2 });
    expect(h).toHaveBeenCalledTimes(1);
  });

  it('scopes keys per user', async () => {
    await run(
      interceptor,
      ctx({ key: KEY, userId: 'u1' }),
      jest.fn(() => of({ who: 'u1' }))
    );
    const h = jest.fn(() => of({ who: 'u2' }));
    await expect(run(interceptor, ctx({ key: KEY, userId: 'u2' }), h)).resolves.toEqual({ who: 'u2' });
    expect(h).toHaveBeenCalledTimes(1);
  });
});
