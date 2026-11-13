import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { orgConstantsV2Service } from '../organization_constants_v2.service';

const BASE = 'http://localhost:3000/api/v2/organization-constants';

const detail = { id: 'c1', name: 'API_URL', type: 'Global', values: [] };

describe('orgConstantsV2Service', () => {
  test('list sends the filters as a query string and returns the page', async () => {
    let requestUrl;
    const page = { items: [], page: 2, page_size: 50, total: 0, counts: { secrets: 0, globals: 0 } };
    server.use(
      http.get(BASE, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json(page);
      })
    );

    const result = await orgConstantsV2Service.list({
      environmentId: 'env-1',
      type: 'Global',
      search: 'api',
      source: ['workspace', 'env'],
      sort: 'modified_desc',
      page: 2,
      perPage: 50,
    });

    expect(result).toEqual(page);
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
      environment_id: 'env-1',
      type: 'Global',
      search: 'api',
      source: 'workspace,env',
      sort: 'modified_desc',
      page: '2',
      per_page: '50',
    });
  });

  test('list leaves out filters that are not set', async () => {
    let requestUrl;
    server.use(
      http.get(BASE, ({ request }) => {
        requestUrl = new URL(request.url);
        return HttpResponse.json({ items: [] });
      })
    );

    await orgConstantsV2Service.list({ environmentId: 'env-1', type: 'Secret', search: '', page: 1 });

    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({ environment_id: 'env-1', type: 'Secret', page: '1' });
  });

  test('list passes the abort signal through to fetch', async () => {
    server.use(http.get(BASE, () => new Promise(() => {})));
    const controller = new AbortController();

    const request = orgConstantsV2Service.list(
      { environmentId: 'env-1', type: 'Global' },
      { signal: controller.signal }
    );
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  test('get reads one constant by id', async () => {
    server.use(http.get(`${BASE}/c1`, () => HttpResponse.json(detail)));

    await expect(orgConstantsV2Service.get('c1')).resolves.toEqual(detail);
  });

  test('create posts the body as JSON', async () => {
    let body;
    server.use(
      http.post(BASE, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(detail, { status: 201 });
      })
    );
    const payload = { name: 'API_URL', type: 'Global', values: [{ environment_id: 'env-1', value: 'x' }] };

    await expect(orgConstantsV2Service.create(payload)).resolves.toEqual(detail);
    expect(body).toEqual(payload);
  });

  test('create surfaces a 409 with its status code and message', async () => {
    server.use(http.post(BASE, () => HttpResponse.json({ message: 'Constant already exists' }, { status: 409 })));

    await expect(orgConstantsV2Service.create({ name: 'API_URL', type: 'Global', values: [] })).rejects.toMatchObject({
      statusCode: 409,
      error: 'Constant already exists',
    });
  });

  test('update patches the values of one constant', async () => {
    let body;
    server.use(
      http.patch(`${BASE}/c1`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(detail);
      })
    );
    const payload = { values: [{ environment_id: 'env-1', value: null }] };

    await expect(orgConstantsV2Service.update('c1', payload)).resolves.toEqual(detail);
    expect(body).toEqual(payload);
  });

  test('bulkDelete posts the ids and returns deleted and skipped ids', async () => {
    let body;
    const response = { deleted_ids: ['c1'], skipped_ids: ['env:Global:FOO'] };
    server.use(
      http.post(`${BASE}/bulk-delete`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(response);
      })
    );

    await expect(orgConstantsV2Service.bulkDelete(['c1', 'env:Global:FOO'])).resolves.toEqual(response);
    expect(body).toEqual({ ids: ['c1', 'env:Global:FOO'] });
  });

  test('ids are encoded in the path', async () => {
    server.use(http.get(`${BASE}/:id`, ({ params }) => HttpResponse.json({ id: params.id })));

    await expect(orgConstantsV2Service.get('a/b')).resolves.toEqual({ id: 'a/b' });
  });
});
