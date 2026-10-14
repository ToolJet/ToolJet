import {
  REDACTED,
  redactUrlQuery,
  outgoingHttpAttributes,
  requestSpanAttributes,
  routeSpanName,
} from '@otel/http-span';

describe('requestSpanAttributes', () => {
  it('never returns the request body', () => {
    const attrs = requestSpanAttributes({
      params: {},
      query: {},
      body: { email: 'a@b.c', password: 'hunter2' },
    } as never);
    expect(JSON.stringify(attrs)).not.toContain('hunter2');
    expect(attrs).not.toHaveProperty('http.body');
  });

  it('redacts secret-looking keys in query and params, keeps the rest', () => {
    const attrs = requestSpanAttributes({
      params: { id: 'app-1', token: 'abc' },
      query: { page: '2', code: 'oauth-code', nested: { apiKey: 'k', mode: 'edit' } },
    });
    expect(JSON.parse(attrs['http.params'])).toEqual({ id: 'app-1', token: REDACTED });
    expect(JSON.parse(attrs['http.query'])).toEqual({
      page: '2',
      code: REDACTED,
      nested: { apiKey: REDACTED, mode: 'edit' },
    });
  });

  it('omits empty params and query', () => {
    expect(requestSpanAttributes({ params: {}, query: {} })).toEqual({});
  });
});

describe('redactUrlQuery', () => {
  it('redacts secret values, keeps others', () => {
    expect(redactUrlQuery('/invite?token=abc&org=1')).toBe(`/invite?token=${REDACTED}&org=1`);
  });
  it('redacts oauth code', () => {
    expect(redactUrlQuery('/cb?code=x&state=y')).toBe(`/cb?code=${REDACTED}&state=y`);
  });
  it('leaves urls without query unchanged', () => {
    expect(redactUrlQuery('/api/apps/1')).toBe('/api/apps/1');
  });
  it('handles full urls and fragments', () => {
    expect(redactUrlQuery('http://h/x?token=a#f')).toBe(`http://h/x?token=${REDACTED}#f`);
  });
});

describe('outgoingHttpAttributes', () => {
  it('redacts secret query on outgoing requests', () => {
    expect(outgoingHttpAttributes({ path: '/x?api_key=s&page=2', host: 'h.io', protocol: 'https:' })).toEqual({
      'http.target': `/x?api_key=${REDACTED}&page=2`,
      'http.url': `https://h.io/x?api_key=${REDACTED}&page=2`,
      'url.full': `https://h.io/x?api_key=${REDACTED}&page=2`,
      'url.query': `api_key=${REDACTED}&page=2`,
    });
  });
  it('is empty without a query', () => {
    expect(outgoingHttpAttributes({ path: '/x' })).toEqual({});
  });
});

describe('routeSpanName', () => {
  it('does not rename without a matched route (literal path carries ids)', () => {
    expect(routeSpanName({ method: 'GET' })).toBeUndefined();
  });
  it('uses the route template', () => {
    expect(routeSpanName({ method: 'GET', route: { path: '/api/apps/:id' } })).toEqual({
      name: 'GET /api/apps/:id',
      route: '/api/apps/:id',
    });
  });
  it('skips non-api and health routes', () => {
    expect(routeSpanName({ method: 'GET', route: { path: '/api/health' } })).toBeUndefined();
    expect(routeSpanName({ method: 'GET', route: { path: '/assets' } })).toBeUndefined();
  });
});
