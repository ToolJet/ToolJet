import {
  REDACTED,
  redactUrlQuery,
  incomingHttpAttributes,
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
    expect(attrs).not.toHaveProperty(['http.body']);
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
    expect(
      outgoingHttpAttributes({
        path: '/x?api_key=s&page=2',
        host: 'h.io',
        protocol: 'https:',
        getHeader: (n: string) => (n === 'host' ? 'h.io:8443' : undefined),
      })
    ).toEqual({
      'http.target': `/x?api_key=${REDACTED}&page=2`,
      'http.url': `https://h.io:8443/x?api_key=${REDACTED}&page=2`,
      'url.full': `https://h.io:8443/x?api_key=${REDACTED}&page=2`,
      'url.query': `api_key=${REDACTED}&page=2`,
    });
  });
  it('falls back to host without a host header', () => {
    expect(outgoingHttpAttributes({ path: '/x?token=t', host: 'h.io' })['http.url']).toBe(
      `http://h.io/x?token=${REDACTED}`
    );
  });
  it('is empty without a query', () => {
    expect(outgoingHttpAttributes({ path: '/x' })).toEqual({});
  });
});

describe('incomingHttpAttributes', () => {
  it.each([
    ['/reset-password/tok', `/reset-password/${REDACTED}`],
    ['/my-ws/reset-password/tok', `/my-ws/reset-password/${REDACTED}`],
    ['/invitations/tok', `/invitations/${REDACTED}`],
    ['/invitations/tok/workspaces/orgtok', `/invitations/${REDACTED}/workspaces/${REDACTED}`],
    ['/organization-invitations/tok', `/organization-invitations/${REDACTED}`],
  ])('redacts token path segment in %s', (raw, path) => {
    expect(incomingHttpAttributes(raw, 'h:3000')).toEqual({
      'http.target': path,
      'http.url': `http://h:3000${path}`,
      'url.path': path,
    });
  });
  it('redacts path and query together', () => {
    expect(incomingHttpAttributes('/invitations/tok?token=t&a=1', 'h')).toEqual({
      'http.target': `/invitations/${REDACTED}?token=${REDACTED}&a=1`,
      'http.url': `http://h/invitations/${REDACTED}?token=${REDACTED}&a=1`,
      'url.path': `/invitations/${REDACTED}`,
      'url.query': `token=${REDACTED}&a=1`,
    });
  });
  it('leaves api paths alone', () => {
    expect(incomingHttpAttributes('/api/reset-password/verify-token', 'h')).toEqual({});
  });
  it('is empty when nothing to redact', () => {
    expect(incomingHttpAttributes('/my-ws/apps/1', 'h')).toEqual({});
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
