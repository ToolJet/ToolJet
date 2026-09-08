// server/test/modules/app/unit/mutable-app-version.guard.spec.ts
import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { MutableAppVersionGuard } from '@modules/apps/guards/mutable-app-version.guard';

/** @group platform */
describe('MutableAppVersionGuard', () => {
  let guard: MutableAppVersionGuard;

  const RELEASED_VERSION_ID = 'ver-550e8400-e29b-41d4-a716-446655440000';
  const DRAFT_VERSION_ID = 'ver-550e8400-e29b-41d4-a716-446655440001';

  // Builds an app as ValidAppGuard would leave it on request.tj_app: currentVersionId
  // is the released-version pointer, appVersions[0] is the version filtered by :versionId.
  const makeApp = (overrides: Record<string, any> = {}) => ({
    id: 'app-550e8400-e29b-41d4-a716-446655440009',
    currentVersionId: RELEASED_VERSION_ID,
    appVersions: [{ id: DRAFT_VERSION_ID }],
    ...overrides,
  });

  const makeContext = (
    tj_app: Record<string, any> | undefined,
    params: { versionId?: string } = {},
    body: Record<string, any> = {}
  ): ExecutionContext => {
    const request: Record<string, any> = { params, body, tj_app };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new MutableAppVersionGuard();
  });

  describe('editing the released version', () => {
    it('throws BadRequestException when appVersions[0] is the released version', () => {
      const app = makeApp({ appVersions: [{ id: RELEASED_VERSION_ID }] });

      expect(() => guard.canActivate(makeContext(app, { versionId: RELEASED_VERSION_ID }))).toThrow(
        BadRequestException
      );
    });

    it('throws BadRequestException when only the versionId param identifies the released version', () => {
      // appVersions not loaded -> guard falls back to the route param.
      const app = makeApp({ appVersions: undefined });

      expect(() => guard.canActivate(makeContext(app, { versionId: RELEASED_VERSION_ID }))).toThrow(
        BadRequestException
      );
    });
  });

  describe('editing a non-released version', () => {
    it('returns true when the edited version differs from currentVersionId', () => {
      const app = makeApp({ appVersions: [{ id: DRAFT_VERSION_ID }] });

      expect(guard.canActivate(makeContext(app, { versionId: DRAFT_VERSION_ID }))).toBe(true);
    });
  });

  describe('app never released', () => {
    it('returns true when currentVersionId is not set', () => {
      const app = makeApp({ currentVersionId: null, appVersions: [{ id: DRAFT_VERSION_ID }] });

      expect(guard.canActivate(makeContext(app, { versionId: DRAFT_VERSION_ID }))).toBe(true);
    });
  });

  describe('version-switch escape hatch', () => {
    it('returns true for the released version when is_user_switched_version is true', () => {
      const app = makeApp({ appVersions: [{ id: RELEASED_VERSION_ID }] });

      expect(
        guard.canActivate(makeContext(app, { versionId: RELEASED_VERSION_ID }, { is_user_switched_version: true }))
      ).toBe(true);
    });
  });

  describe('app not resolved on the request', () => {
    it('returns true and defers to the app-resolution guard', () => {
      expect(guard.canActivate(makeContext(undefined, { versionId: RELEASED_VERSION_ID }))).toBe(true);
    });
  });
});
