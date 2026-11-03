import 'reflect-metadata';
jest.mock('@modules/session/util.service', () => ({ SessionUtilService: class {} }));
jest.mock('@modules/users/repositories/repository', () => ({ UserRepository: class {} }));
jest.mock('@modules/apps/repository', () => ({ AppsRepository: class {} }));
jest.mock('@modules/organizations/repository', () => ({ OrganizationRepository: class {} }));
jest.mock('@modules/organization-users/repository', () => ({ OrganizationUsersRepository: class {} }));
jest.mock('@helpers/utils.helper', () => ({}));
import { SessionService } from '@modules/session/service';

describe('Read-only OAuth viewer bootstrap', () => {
  const user: any = { id: 'synthetic-user', oauthGrantId: 'synthetic-grant', oauthAppId: 'synthetic-app', organizationId: 'orchard' };
  const app = { id: 'synthetic-app', slug: 'inventory', organizationId: 'orchard', isPublic: false, currentVersionId: null };
  const organization = { id: 'orchard', slug: 'orchard-workspace' };
  let service: any;
  beforeEach(() => {
    service = Object.create(SessionService.prototype);
    service.appsRepository = { findOne: jest.fn().mockResolvedValue(app) };
    service.organizationRepository = { fetchOrganization: jest.fn().mockResolvedValue(organization) };
    service.userRepository = { updateOne: jest.fn() };
    service.sessionUtilService = { generateSessionPayload: jest.fn().mockResolvedValue({ current_organization_id: 'orchard' }), createSession: jest.fn() };
  });
  test.each([undefined, 'synthetic-app', 'inventory'])('boot read for %s keeps original workspace and creates no session', async (requestedApp) => {
    expect(await service.getSessionDetails(user, undefined, requestedApp, { secret: 'ignored-ai-cookie' }))
      .toEqual({ current_organization_id: 'orchard' });
    expect(service.sessionUtilService.generateSessionPayload).toHaveBeenCalledWith(user, organization,
      { organizationId: 'orchard', isPublic: false, isReleased: false });
    expect(service.userRepository.updateOne).not.toHaveBeenCalled();
    expect(service.sessionUtilService.createSession).not.toHaveBeenCalled();
  });
  test.each([['another-app', undefined], [undefined, 'another-workspace']])('cannot choose another app/workspace %s %s', async (appId, workspace) => {
    await expect(service.getSessionDetails(user, workspace, appId)).rejects.toThrow();
    expect(service.sessionUtilService.generateSessionPayload).not.toHaveBeenCalled();
  });
  test('fails closed when the app moves workspace or disappears', async () => {
    service.appsRepository.findOne.mockResolvedValue({ ...app, organizationId: 'other' });
    await expect(service.getSessionDetails(user)).rejects.toThrow();
    service.appsRepository.findOne.mockResolvedValue(null);
    await expect(service.getSessionDetails(user)).rejects.toThrow();
  });
});
