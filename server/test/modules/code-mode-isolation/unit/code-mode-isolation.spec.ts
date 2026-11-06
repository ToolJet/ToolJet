import { resolveCodeModeIsolation } from '@helpers/code-mode-isolation.helper';
import { fetchAppWorkspaceDomainOrigins } from '@helpers/bootstrap.helper';

const resolve = (env: Record<string, string | undefined>) => resolveCodeModeIsolation(env as NodeJS.ProcessEnv);

describe('CODE_MODE_ISOLATION', () => {
  it('is on when unset', () => {
    expect(resolve({})).toMatchObject({ mode: 'on', strictBindings: true, messages: [] });
    expect(resolve({ CODE_MODE_ISOLATION: '  ' }).mode).toBe('on');
  });

  it('takes off, viewer and on, in any case, and warns about the first two', () => {
    expect(resolve({ CODE_MODE_ISOLATION: 'on' })).toMatchObject({ mode: 'on', messages: [] });
    const viewer = resolve({ CODE_MODE_ISOLATION: 'Viewer' });
    expect(viewer.mode).toBe('viewer');
    expect(viewer.messages).toEqual([expect.objectContaining({ level: 'warn', text: expect.stringMatching(/editor/) })]);
    const off = resolve({ CODE_MODE_ISOLATION: 'OFF ' });
    expect(off.mode).toBe('off');
    expect(off.messages[0].level).toBe('warn');
  });

  it.each(['opaque', 'per-app', 'true', 'false', '0', 'disabled'])('fails closed on an unknown value: %s', (value) => {
    const resolved = resolve({ CODE_MODE_ISOLATION: value });
    expect(resolved.mode).toBe('on');
    expect(resolved.messages).toEqual([expect.objectContaining({ level: 'warn', text: expect.stringContaining(value) })]);
  });

  it.each(['off', 'viewer'])('cloud runs on whatever it says (%s), and logs an error', (value) => {
    const resolved = resolve({ TOOLJET_EDITION: 'cloud', CODE_MODE_ISOLATION: value });
    expect(resolved.mode).toBe('on');
    expect(resolved.messages).toEqual([expect.objectContaining({ level: 'error', text: expect.stringContaining('cloud') })]);
  });

  it('cloud with an unknown value or none runs on too', () => {
    expect(resolve({ TOOLJET_EDITION: 'cloud', CODE_MODE_ISOLATION: 'nonsense' }).mode).toBe('on');
    expect(resolve({ TOOLJET_EDITION: 'cloud' })).toMatchObject({ mode: 'on', messages: [] });
  });

  it('cloud keeps strict bindings on', () => {
    const resolved = resolve({ TOOLJET_EDITION: 'Cloud', CODE_MODE_ISOLATION: 'on', CODE_MODE_STRICT_BINDINGS: 'false' });
    expect(resolved.strictBindings).toBe(true);
    expect(resolved.messages).toEqual([expect.objectContaining({ level: 'error' })]);
  });

  it('self-hosted may turn strict bindings off', () => {
    expect(resolve({ TOOLJET_EDITION: 'ee', CODE_MODE_STRICT_BINDINGS: 'false' }).strictBindings).toBe(false);
  });
});

describe("a per-app frame's trusted parents", () => {
  const APP = '4ad8aff5-2d7d-4a78-a7ed-43035ba67876';
  const logger = { error: jest.fn() };

  it("reads only the app's own workspace's active domain", async () => {
    const query = jest.fn().mockResolvedValue([{ domain: 'Apps.Acme.example' }]);
    const origins = await fetchAppWorkspaceDomainOrigins({ query } as any, APP, logger);
    expect(origins).toEqual(['https://apps.acme.example']);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/JOIN apps a ON a\.organization_id = cd\.organization_id/);
    expect(sql).toMatch(/a\.id = \$1/);
    expect(sql).toMatch(/status = 'active'/);
    expect(params).toEqual([APP]);
  });

  it('asks nothing for a host that names no app', async () => {
    const query = jest.fn();
    expect(await fetchAppWorkspaceDomainOrigins({ query } as any, 'not-a-uuid', logger)).toEqual([]);
    expect(await fetchAppWorkspaceDomainOrigins({ query } as any, undefined as any, logger)).toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });

  it('trusts no domain when the lookup fails', async () => {
    const query = jest.fn().mockRejectedValue(new Error('down'));
    expect(await fetchAppWorkspaceDomainOrigins({ query } as any, APP, logger)).toEqual([]);
    expect(logger.error).toHaveBeenCalled();
  });
});
