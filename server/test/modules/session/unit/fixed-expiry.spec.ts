jest.mock('@modules/mcp-oauth/service', () => ({ McpOAuthService: class {} }));
const manager = { findOne: jest.fn(), save: jest.fn() };
jest.mock('@helpers/database.helper', () => ({ dbTransactionWrap: (operation) => operation(manager) }));
jest.mock('@helpers/utils.helper', () => ({
  isHttpsEnabled: () => false,
  isSuperAdmin: () => false,
  applyCustomDomainCookieOptions: jest.fn(),
}));
jest.mock('@modules/request-context/service', () => ({ RequestContext: { currentContext: undefined } }));
jest.mock('@otel/tracing', () => ({ trackUserActivity: jest.fn(), extractAppIdFromPath: jest.fn() }));
import 'reflect-metadata';
import { SessionUtilService } from '@modules/session/util.service';

describe('validateUserSession, PAT sessions', () => {
  const inTen = () => new Date(Date.now() + 10 * 60 * 1000);
  const validate = async (options?: { fixedExpiry?: boolean }) => {
    const expiry = inTen();
    const session: any = {
      sessionType: 'pat',
      expiry,
      pat: { expiresAt: new Date(Date.now() + 86400000), sessionExpiryMinutes: 125 },
      user: {},
    };
    manager.findOne.mockResolvedValue(session);
    manager.save.mockResolvedValue(session);
    const util = Object.create(SessionUtilService.prototype);
    await util.validateUserSession('user-1', 'session-1', undefined, options);
    return { session, expiry };
  };

  it('extends an ordinary PAT session', async () => {
    const { session, expiry } = await validate();
    expect(session.expiry.getTime()).toBeGreaterThan(expiry.getTime());
  });

  it('leaves a fixed-expiry session where it is', async () => {
    const { session, expiry } = await validate({ fixedExpiry: true });
    expect(session.expiry).toBe(expiry);
  });
});
