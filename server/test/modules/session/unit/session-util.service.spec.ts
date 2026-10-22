/**
 * SessionUtilService.validateUserSession — PAT session sliding expiry.
 *
 * A PAT session minted for the full PAT window slides forward on use; one deliberately minted
 * shorter (e.g. an app-scoped render session) keeps its expiry.
 *
 * @group platform
 */
import { SessionUtilService } from '@modules/session/util.service';
import { SessionType } from '@modules/external-apis/constants';

const mockManager = {
  findOne: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((cb: (manager: any) => Promise<any>) => cb(mockManager)),
}));

jest.mock('@otel/tracing', () => ({
  trackUserActivity: jest.fn(),
  extractAppIdFromPath: jest.fn(),
}));

jest.mock('@modules/request-context/service', () => ({
  RequestContext: { setLocals: jest.fn() },
}));

const MINUTE = 60 * 1000;
const PAT_WINDOW_MINUTES = 14400;
const PAT_WINDOW_MS = PAT_WINDOW_MINUTES * MINUTE;

function patSession(createdAt: Date, expiry: Date) {
  return {
    id: 'session-1',
    sessionType: SessionType.PAT,
    createdAt,
    expiry,
    pat: { sessionExpiryMinutes: PAT_WINDOW_MINUTES, expiresAt: new Date(Date.now() + 30 * 24 * 60 * MINUTE) },
  };
}

describe('SessionUtilService.validateUserSession (PAT sessions)', () => {
  let service: SessionUtilService;

  beforeEach(() => {
    jest.clearAllMocks();
    const stub = {} as any;
    service = new SessionUtilService(stub, stub, stub, stub, stub, stub, stub, stub, stub, stub);
  });

  async function expiryAfterValidation(createdAt: Date, expiry: Date): Promise<number> {
    const session = patSession(createdAt, expiry);
    mockManager.findOne.mockResolvedValueOnce(session);
    await service.validateUserSession('user-1', 'session-1');
    expect(mockManager.save).toHaveBeenCalledWith(session);
    return session.expiry.getTime();
  }

  it('extends a session minted for the full PAT window', async () => {
    const createdAt = new Date(Date.now() - 60 * MINUTE);
    const before = Date.now();

    const expiry = await expiryAfterValidation(createdAt, new Date(createdAt.getTime() + PAT_WINDOW_MS));

    expect(expiry).toBeGreaterThanOrEqual(before + PAT_WINDOW_MS);
  });

  it('keeps the expiry of a session minted well under the PAT window', async () => {
    const createdAt = new Date(Date.now() - 10 * MINUTE);
    const minted = new Date(createdAt.getTime() + 60 * MINUTE);

    const expiry = await expiryAfterValidation(createdAt, new Date(minted));

    expect(expiry).toBe(minted.getTime());
  });

  it('extends a full-window session minted 30s short, within the clock tolerance', async () => {
    const createdAt = new Date(Date.now() - 60 * MINUTE);
    const before = Date.now();

    const expiry = await expiryAfterValidation(createdAt, new Date(createdAt.getTime() + PAT_WINDOW_MS - 30 * 1000));

    expect(expiry).toBeGreaterThanOrEqual(before + PAT_WINDOW_MS);
  });

  it('keeps extending a session that has already slid past its minted window', async () => {
    const createdAt = new Date(Date.now() - 5 * 24 * 60 * MINUTE);
    const before = Date.now();

    const expiry = await expiryAfterValidation(createdAt, new Date(Date.now() + PAT_WINDOW_MS));

    expect(expiry).toBeGreaterThanOrEqual(before + PAT_WINDOW_MS);
  });
});
