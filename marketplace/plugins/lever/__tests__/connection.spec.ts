import { QueryError } from '@tooljet-marketplace/common';
import Lever from '../lib';
import { Operation } from '../lib/types';
import { buildRequest } from '../lib/query_operations';

const sourceOptions = { apiKey: 'test-key', environment: 'production' };

const clientReturning = (body: unknown) => {
  const client = jest.fn(async () => ({ body: typeof body === 'string' ? body : JSON.stringify(body) }));
  return client;
};

const clientFailing = (statusCode: number, body: string) => {
  const error: any = new Error(`Response code ${statusCode}`);
  error.response = { statusCode, body };
  return jest.fn(async () => {
    throw error;
  });
};

describe('Lever', () => {
  describe('testConnection', () => {
    it('validates the key against GET /users', async () => {
      const plugin = new Lever();
      const client = clientReturning({ data: [] });
      jest.spyOn(plugin, 'getConnection').mockResolvedValue(client as any);

      await expect(plugin.testConnection(sourceOptions)).resolves.toEqual({ status: 'ok' });
      expect(client).toHaveBeenCalledWith('users', { searchParams: { limit: 1 } });
    });

    it('rejects with a clear message on a bad key', async () => {
      const plugin = new Lever();
      jest
        .spyOn(plugin, 'getConnection')
        .mockResolvedValue(clientFailing(401, '{"error":{"code":"Unauthorized","message":"Invalid credentials"}}') as any);

      await expect(plugin.testConnection(sourceOptions)).rejects.toBeInstanceOf(QueryError);
    });
  });

  describe('run', () => {
    it('parses the Lever envelope and returns data', async () => {
      const plugin = new Lever();
      const client = clientReturning({ data: [{ id: 'abc' }], hasNext: false });
      jest.spyOn(plugin, 'getConnection').mockResolvedValue(client as any);

      const result = await plugin.run(sourceOptions, { operation: Operation.ListStages }, 'ds-id');
      expect(result.status).toBe('ok');
      expect(result.data).toEqual({ data: [{ id: 'abc' }], hasNext: false });
      expect(client).toHaveBeenCalledWith('stages', expect.objectContaining({ method: 'get' }));
    });

    it('surfaces the Lever error message instead of a bare status', async () => {
      const plugin = new Lever();
      jest
        .spyOn(plugin, 'getConnection')
        .mockResolvedValue(clientFailing(404, '{"error":{"code":"NotFound","message":"stage not found"}}') as any);

      await expect(
        plugin.run(
          sourceOptions,
          { operation: Operation.UpdateOpportunityStage, opportunity_id: 'abc', stage_id: 'nope' },
          'ds-id'
        )
      ).rejects.toMatchObject({ message: 'Query could not be completed' });
    });

    it('rejects invalid field input before any HTTP call', async () => {
      const plugin = new Lever();
      const client = clientReturning({});
      jest.spyOn(plugin, 'getConnection').mockResolvedValue(client as any);

      await expect(
        plugin.run(
          sourceOptions,
          { operation: Operation.CreatePosting, text: 'Job', perform_as: 'u1', lists_json: '{bad json' },
          'ds-id'
        )
      ).rejects.toBeInstanceOf(QueryError);
      expect(client).not.toHaveBeenCalled();
    });
  });
});

describe('buildRequest', () => {
  it('builds stage changes as PUT /opportunities/:id/stage', () => {
    expect(buildRequest(Operation.UpdateOpportunityStage, { opportunity_id: 'abc', stage_id: 's1' })).toEqual({
      method: 'put',
      path: 'opportunities/abc/stage',
      searchParams: {},
      json: { stage: 's1' },
    });
  });

  it('splits archiving and unarchiving through the reason field', () => {
    const archive = buildRequest(Operation.ArchiveOpportunity, {
      opportunity_id: 'abc',
      archive_reason_id: 'r1',
      clean_interviews: 'true',
    });
    expect(archive).toEqual({
      method: 'put',
      path: 'opportunities/abc/archived',
      searchParams: {},
      json: { reason: 'r1', cleanInterviews: true },
    });

    const unarchive = buildRequest(Operation.UnarchiveOpportunity, { opportunity_id: 'abc' });
    expect(unarchive.json).toEqual({ reason: null });
  });

  it('drops empty list filters but keeps a false archive filter', () => {
    const request = buildRequest(Operation.ListOpportunities, {
      archived: 'false',
      stage_id: '  ',
      limit: '50',
    });
    expect(request.method).toBe('get');
    expect(request.path).toBe('opportunities');
    expect(request.searchParams).toEqual({ archived: 'false', limit: 50 });
  });

  it('treats "any" as no filter', () => {
    const request = buildRequest(Operation.ListPostings, { state: 'any', confidentiality: 'any' });
    expect(request.searchParams).toEqual({});
  });

  it('turns comma-separated fields into the arrays Lever expects', () => {
    const request = buildRequest(Operation.CreateOpportunity, {
      name: 'Ada',
      emails: 'ada@example.com, lovelace@example.com',
      tags: 'backend, remote',
      perform_as: 'u1',
    });
    expect(request.json).toEqual({
      name: 'Ada',
      emails: ['ada@example.com', 'lovelace@example.com'],
      tags: ['backend', 'remote'],
    });
    expect(request.searchParams).toEqual({ perform_as: 'u1' });
  });

  it('assembles the posting content object from individual fields', () => {
    const request = buildRequest(Operation.CreatePosting, {
      text: 'Engineer',
      perform_as: 'u1',
      category_team: 'Platform',
      workplace_type: 'remote',
      description_plain: 'Build things',
      lists_json: '[{"text":"Reqs","content":"item"}]',
    });
    expect(request).toEqual({
      method: 'post',
      path: 'postings',
      searchParams: { perform_as: 'u1' },
      json: {
        text: 'Engineer',
        workplaceType: 'remote',
        categories: { team: 'Platform' },
        content: {
          descriptionPlain: 'Build things',
          lists: [{ text: 'Reqs', content: 'item' }],
        },
      },
    });
  });

  it('adds tags as an array body', () => {
    const request = buildRequest(Operation.AddOpportunityTags, { opportunity_id: 'abc', tags: 'a, b' });
    expect(request).toEqual({
      method: 'post',
      path: 'opportunities/abc/addTags',
      searchParams: {},
      json: { tags: ['a', 'b'] },
    });
  });

  it('rejects unknown operations', () => {
    expect(() => buildRequest('nope' as Operation, {})).toThrow('Invalid operation');
  });
});
