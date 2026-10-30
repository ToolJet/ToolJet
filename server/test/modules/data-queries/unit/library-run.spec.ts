/**
 * runLibraryQuery / getLibraryDefinition: what comes back with a library run (resolved scope, transformation)
 * and the Python-transformation refusal on draft pins. Collaborators are stubbed; the SQL side is in the e2e spec.
 */
import { BadRequestException } from '@nestjs/common';
import { DataQueriesService } from '@modules/data-queries/service';
import { DataQueryRepository } from '@modules/data-queries/repository';
import { DataQueriesUtilService } from '@modules/data-queries/util.service';
import { App } from '@entities/app.entity';
import { User } from '@entities/user.entity';
import { RunLibraryQueryDto } from '@modules/data-queries/dto';
import { Response } from 'express';

describe('DataQueriesService library runs', () => {
  const findOneBy = jest.fn();
  const getAll = jest.fn();
  const find = jest.fn();
  const resolveLibraryServerReferences = jest.fn();
  const service = new DataQueriesService(
    { manager: { findOneBy, find }, getAll } as unknown as DataQueryRepository,
    { resolveLibraryServerReferences } as unknown as DataQueriesUtilService,
    null,
    null,
    null,
    null,
    null
  );
  const runAndGetResult = jest.fn();
  const loadLibraryTarget = jest.fn();
  Object.assign(service, { runAndGetResult, loadLibraryTarget });

  const app = { id: 'app', organizationId: 'org1' } as unknown as App;
  const user = { id: 'u1', organizationId: 'org1', email: 'a@b.c', firstName: 'A', lastName: 'B' } as unknown as User;
  const dto = (body: object) => body as RunLibraryQueryDto;
  const response = {} as Response;
  const consumer = { id: 'c1', name: 'getCustomerLib', options: {}, permissions: [] };
  const libraryDraft = { id: 'q1', appVersionId: 'av1', appVersion: { id: 'av1', branchId: 'br1' } };
  const target = (options: Record<string, unknown>, kind = 'restapi') => ({
    consumer,
    libraryDraft,
    target: { queryId: 'q1', name: 'getCustomer', kind, dataSourceId: 'ds1', options, versionName: 'draft' },
  });
  const options = {
    url: 'http://x/{{input.id}}/{{input.limit}}',
    inputs: [
      { name: 'id', defaultValue: '1' },
      { name: 'limit', defaultValue: '{{5}}' },
      { name: 'unused', defaultValue: 'u' },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    findOneBy.mockResolvedValue({ id: 'ds1' });
    runAndGetResult.mockResolvedValue({ status: 'ok', data: [1] });
  });

  it('returns the resolved scope with the transformation', async () => {
    loadLibraryTarget.mockResolvedValue(
      target({ ...options, enableTransformation: true, transformation: 'return data' })
    );

    const result = await service.runLibraryQuery(
      user,
      'c1',
      dto({ inputs: { id: 9, limit: 2, evil: 1 } }),
      response,
      app
    );

    expect(result).toEqual({
      status: 'ok',
      data: [1],
      libraryTransformation: 'return data',
      libraryScope: { input: { id: 9, limit: 2, unused: 'u' } },
    });
  });

  it('applies defaults to the scope, per name', async () => {
    loadLibraryTarget.mockResolvedValue(
      target({ ...options, enableTransformation: true, transformation: 'return data' })
    );

    const result = (await service.runLibraryQuery(user, 'c1', dto({}), response, app)) as { libraryScope: unknown };

    expect(result.libraryScope).toEqual({ input: { id: '1', limit: 5, unused: 'u' } });
  });

  it('sends neither transformation nor scope when no transformation is enabled', async () => {
    loadLibraryTarget.mockResolvedValue(target({ ...options, enableTransformation: false, transformation: 'x' }));

    const result = await service.runLibraryQuery(user, 'c1', dto({}), response, app);

    expect(result).toEqual({ status: 'ok', data: [1] });
  });

  describe('server references in defaults', () => {
    const withReferences = {
      url: 'http://x/{{input.region.toUpperCase()}}/{{input.m}}',
      inputs: [
        { name: 'region', defaultValue: '{{constants.region}}' },
        { name: 'n', defaultValue: '{{secrets.k}}' },
        { name: 'm' },
      ],
      enableTransformation: true,
      transformation: 'return data',
    };

    beforeEach(() => {
      resolveLibraryServerReferences.mockResolvedValue(
        new Map([
          ['{{constants.region}}', 'emea'],
          ['{{secrets.k}}', 'TOPSECRET'],
        ])
      );
    });

    it('resolves default references in the consumer environment and lets templates use them', async () => {
      loadLibraryTarget.mockResolvedValue(target(withReferences));

      await service.runLibraryQuery(user, 'c1', dto({}), response, app, 'env1');

      expect(resolveLibraryServerReferences).toHaveBeenCalledWith(
        ['{{constants.region}}', '{{secrets.k}}'],
        { id: 'ds1' },
        'org1',
        'env1',
        undefined,
        user
      );
      const variableMap = runAndGetResult.mock.calls[0][2];
      expect(variableMap['{{input.region.toUpperCase()}}']).toBe('EMEA');
    });

    it('never expands a supplied value, and keeps the scope unresolved', async () => {
      loadLibraryTarget.mockResolvedValue(target(withReferences));

      const result = (await service.runLibraryQuery(
        user,
        'c1',
        dto({ inputs: { m: '{{secrets.k}}' } }),
        response,
        app
      )) as { libraryScope: unknown };

      expect(runAndGetResult.mock.calls[0][2]['{{input.m}}']).toBe('{{secrets.k}}');
      expect(result.libraryScope).toEqual({
        input: { region: '{{constants.region}}', n: '{{secrets.k}}', m: '{{secrets.k}}' },
      });
    });

    it('does not look anything up when no default has a reference', async () => {
      loadLibraryTarget.mockResolvedValue(target(options));

      await service.runLibraryQuery(user, 'c1', dto({}), response, app);

      expect(resolveLibraryServerReferences).not.toHaveBeenCalled();
    });
  });

  it('strips request details from the result of a library run', async () => {
    loadLibraryTarget.mockResolvedValue(target({ ...options, enableTransformation: true, transformation: 'x' }));
    runAndGetResult.mockResolvedValue({
      status: 'ok',
      data: [1],
      metadata: { request: { url: 'http://x/1/5' }, queryDefinition: 'http://x/1/5', response: { status: 200 } },
    });

    const result = (await service.runLibraryQuery(user, 'c1', dto({}), response, app)) as {
      metadata: Record<string, unknown>;
    };

    expect(result.metadata).toEqual({ response: { status: 200 } });
    expect(JSON.stringify(result)).not.toContain('http://x/1/5');
  });

  it('strips request details from a failed library run too', async () => {
    loadLibraryTarget.mockResolvedValue(target(options));
    runAndGetResult.mockResolvedValue({
      status: 'failed',
      message: 'boom',
      metadata: { request: { url: 'http://x/1/5' }, queryDefinition: 'http://x/1/5' },
    });

    const result = await service.runLibraryQuery(user, 'c1', dto({}), response, app);

    expect(result).toEqual({ status: 'failed', message: 'boom', metadata: {} });
  });

  it('400s a Python transformation on a run, before the query runs', async () => {
    loadLibraryTarget.mockResolvedValue(
      target({ ...options, enableTransformation: true, transformationLanguage: 'python', transformation: 'x' })
    );

    await expect(service.runLibraryQuery(user, 'c1', dto({}), response, app)).rejects.toThrow(
      new BadRequestException('Library transformations must be JavaScript')
    );
    expect(runAndGetResult).not.toHaveBeenCalled();
  });

  it('400s a Python transformation in the library definition', async () => {
    loadLibraryTarget.mockResolvedValue(
      target(
        { code: 'return 1', enableTransformation: true, transformationLanguage: 'python', transformation: 'x' },
        'runjs'
      )
    );
    getAll.mockResolvedValue([]);
    find.mockResolvedValue([]);

    await expect(service.getLibraryDefinition('c1', app)).rejects.toThrow(
      new BadRequestException('Library transformations must be JavaScript')
    );
  });
});
