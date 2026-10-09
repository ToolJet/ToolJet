/**
 * Regression tests for the EE SignupDisableGuard (instance-level signup toggle).
 *
 * Vulnerability: getSettings(ENABLE_SIGNUP) returns the raw instance_settings.value,
 * which is the STRING 'true' | 'false'. The previous guard did
 *   `return request.body.organizationId || enableSignUp;`
 * and the string 'false' is truthy in JS, so instance-level signup was allowed even
 * when the admin had turned "Enable sign-up" OFF.
 *
 * The guard must:
 *   - block instance-level signup (no organizationId) when ENABLE_SIGNUP !== 'true'
 *   - allow instance-level signup when ENABLE_SIGNUP === 'true'
 *   - allow workspace-level signup (organizationId present) regardless (gated in service)
 *   - fail closed if the setting cannot be read
 */

import { SignupDisableGuard } from '../../../../ee/onboarding/guards/signup-disable.guard';

function makeContext(body: Record<string, any>): any {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  };
}

function makeGuard(getSettingsImpl: () => Promise<any>): SignupDisableGuard {
  const instanceSettingsUtilService: any = { getSettings: jest.fn(getSettingsImpl) };
  return new SignupDisableGuard(instanceSettingsUtilService);
}

describe('EE SignupDisableGuard', () => {
  it('BLOCKS instance-level signup when ENABLE_SIGNUP is the string "false"', async () => {
    const guard = makeGuard(async () => 'false');
    await expect(guard.canActivate(makeContext({ email: 'a@b.com' }))).resolves.toBe(false);
  });

  it('ALLOWS instance-level signup when ENABLE_SIGNUP is the string "true"', async () => {
    const guard = makeGuard(async () => 'true');
    await expect(guard.canActivate(makeContext({ email: 'a@b.com' }))).resolves.toBe(true);
  });

  it('BLOCKS when ENABLE_SIGNUP is unset/null', async () => {
    const guard = makeGuard(async () => null);
    await expect(guard.canActivate(makeContext({ email: 'a@b.com' }))).resolves.toBe(false);
  });

  it('ALLOWS workspace-level signup (organizationId present) regardless of instance toggle', async () => {
    const getSettings = jest.fn(async () => 'false');
    const guard = new SignupDisableGuard({ getSettings } as any);
    await expect(
      guard.canActivate(makeContext({ email: 'a@b.com', organizationId: 'org-1' }))
    ).resolves.toBe(true);
    // Should short-circuit before reading the instance setting.
    expect(getSettings).not.toHaveBeenCalled();
  });

  it('FAILS CLOSED when the instance setting read throws', async () => {
    const guard = makeGuard(async () => {
      throw new Error('db down');
    });
    await expect(guard.canActivate(makeContext({ email: 'a@b.com' }))).resolves.toBe(false);
  });
});
