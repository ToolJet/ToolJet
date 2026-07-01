// server/test/modules/app/unit/valid-app.guard.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { ValidAppGuard } from '@modules/apps/guards/valid-app.guard';

/** @group platform */
describe('ValidAppGuard', () => {
  let guard: ValidAppGuard;
  let mockAppRepository: {
    findById: jest.Mock;
    findBySlug: jest.Mock;
  };

  const UUID = '550e8400-e29b-41d4-a716-446655440000';
  const ORG_ID = 'org-550e8400-e29b-41d4-a716-446655440001';

  const makeContext = (params: { id?: string; slug?: string; versionId?: string } = {}, headers: Record<string, string> = {}): ExecutionContext => {
    const request: Record<string, any> = {
      params,
      headers,
      user: { organizationId: ORG_ID },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  const makeApp = (overrides = {}) => ({
    id: UUID,
    slug: 'my-app',
    organizationId: ORG_ID,
    ...overrides,
  });

  beforeEach(() => {
    mockAppRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
    };
    guard = new ValidAppGuard(mockAppRepository as any);
  });

  afterEach(() => jest.clearAllMocks());

  describe('missing id, slug, and user', () => {
    it('throws BadRequestException', async () => {
      const request: Record<string, any> = { params: {}, headers: {}, user: null };
      const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });
  });

  describe(':id param is a valid UUID', () => {
    it('calls findById — not findBySlug', async () => {
      mockAppRepository.findById.mockResolvedValue(makeApp());

      await guard.canActivate(makeContext({ id: UUID }));

      expect(mockAppRepository.findById).toHaveBeenCalledWith(UUID, ORG_ID, undefined, undefined);
      expect(mockAppRepository.findBySlug).not.toHaveBeenCalled();
    });

    it('forwards versionId and branchId to findById', async () => {
      mockAppRepository.findById.mockResolvedValue(makeApp());

      await guard.canActivate(
        makeContext({ id: UUID, versionId: 'ver-uuid' }, { 'x-branch-id': 'branch-uuid' })
      );

      expect(mockAppRepository.findById).toHaveBeenCalledWith(UUID, ORG_ID, 'ver-uuid', 'branch-uuid');
    });

    it('throws NotFoundException when findById returns null', async () => {
      mockAppRepository.findById.mockResolvedValue(null);

      await expect(guard.canActivate(makeContext({ id: UUID }))).rejects.toThrow(NotFoundException);
    });
  });

  describe(':id param is a non-UUID string (slug in id position)', () => {
    // replaceEditorURL swaps the browser URL from /apps/<uuid> to /apps/<slug>.
    // On refresh the slug lands in :id. Previously this caused a TypeORM UUID
    // parse error; now it routes to findBySlug instead.
    it('calls findBySlug with the id value — not findById', async () => {
      mockAppRepository.findBySlug.mockResolvedValue(makeApp());

      await guard.canActivate(makeContext({ id: 'my-app-slug' }));

      expect(mockAppRepository.findBySlug).toHaveBeenCalledWith('my-app-slug', ORG_ID, undefined, undefined);
      expect(mockAppRepository.findById).not.toHaveBeenCalled();
    });

    it('forwards branchId when x-branch-id header is present', async () => {
      mockAppRepository.findBySlug.mockResolvedValue(makeApp());

      await guard.canActivate(
        makeContext({ id: 'my-app-slug' }, { 'x-branch-id': 'branch-uuid' })
      );

      expect(mockAppRepository.findBySlug).toHaveBeenCalledWith('my-app-slug', ORG_ID, undefined, 'branch-uuid');
    });

    it('throws NotFoundException (not a 500) when slug does not match any app', async () => {
      mockAppRepository.findBySlug.mockResolvedValue(null);

      await expect(guard.canActivate(makeContext({ id: 'no-such-slug' }))).rejects.toThrow(NotFoundException);
      expect(mockAppRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('slug param (no :id)', () => {
    it('calls findBySlug with the slug value', async () => {
      mockAppRepository.findBySlug.mockResolvedValue(makeApp());

      await guard.canActivate(makeContext({ slug: 'my-app' }));

      expect(mockAppRepository.findBySlug).toHaveBeenCalledWith('my-app', ORG_ID, undefined, undefined);
      expect(mockAppRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('request.tj_app already populated', () => {
    it('skips all repo calls and returns true', async () => {
      const app = makeApp();
      const request: Record<string, any> = {
        params: { id: UUID },
        headers: {},
        user: { organizationId: ORG_ID },
        tj_app: app,
      };
      const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(mockAppRepository.findById).not.toHaveBeenCalled();
      expect(mockAppRepository.findBySlug).not.toHaveBeenCalled();
    });
  });

  describe('successful resolution', () => {
    it('attaches app to request.tj_app and sets tj_resource_id', async () => {
      const app = makeApp();
      mockAppRepository.findById.mockResolvedValue(app);

      const request: Record<string, any> = {
        params: { id: UUID },
        headers: {},
        user: { organizationId: ORG_ID },
      };
      const ctx = { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(request.tj_app).toBe(app);
      expect(request.tj_resource_id).toBe(app.id);
    });
  });
});
