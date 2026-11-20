// whatIfTheSignUpIsAtTheWorkspaceLevel calls dbTransactionWrap with no manager, which opens a
// real DB transaction outside a unit test's reach — stub it to just invoke the callback,
// matching test/modules/git-sync-configs/unit/service.spec.ts.
let currentManager: any;
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? currentManager)),
}));

import { OnboardingUtilService } from '@modules/onboarding/util.service';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import * as bcrypt from 'bcrypt';

function makeService(deps: {
  userRepository: any;
  sessionUtilService: any;
  organizationUserRepository: any;
  rolesUtilService: any;
  licenseUserService: any;
  eventEmitter: any;
  organizationUsersUtilService: any;
}) {
  return new OnboardingUtilService(
    deps.userRepository,
    deps.licenseUserService,
    {} as any, // licenseUtilService
    {} as any, // configService
    deps.rolesUtilService,
    deps.eventEmitter,
    {} as any, // licenseCountsService
    deps.organizationUsersUtilService,
    {} as any, // organizationRepository
    deps.sessionUtilService,
    {} as any, // metaDataUtilService
    {} as any, // instanceSettingsUtilService
    deps.organizationUserRepository,
    {} as any // setupOrganizationsUtilService
  );
}

describe('OnboardingUtilService.whatIfTheSignUpIsAtTheWorkspaceLevel — GHSA-7fgx workspace-signup takeover guard', () => {
  const originalEdition = process.env.TOOLJET_EDITION;

  beforeEach(() => {
    process.env.TOOLJET_EDITION = 'ce';
    currentManager = {};
  });

  afterEach(() => {
    process.env.TOOLJET_EDITION = originalEdition;
  });

  it('does not set a password or auto-login an SSO-provisioned user via self-hosted workspace signup', async () => {
    const userRepository = { updateOne: jest.fn() };
    const sessionUtilService = { generateLoginResultPayload: jest.fn() };
    const organizationUserRepository = {
      createOne: jest.fn().mockResolvedValue({
        invitationToken: 'org-invite-token',
        invitationTokenExpiry: null,
        organizationId: 'org-2',
        status: 'invited',
      }),
    };
    const rolesUtilService = { addUserRole: jest.fn().mockResolvedValue(undefined) };
    const licenseUserService = { validateUser: jest.fn().mockResolvedValue(undefined) };
    const eventEmitter = { emit: jest.fn() };
    const organizationUsersUtilService = { activateOrganization: jest.fn().mockResolvedValue(undefined) };

    const service = makeService({
      userRepository,
      sessionUtilService,
      organizationUserRepository,
      rolesUtilService,
      licenseUserService,
      eventEmitter,
      organizationUsersUtilService,
    });

    const existingUser = {
      id: 'victim-1',
      email: 'victim@example.com',
      firstName: 'Victim',
      password: null,
      invitationToken: null,
      organizationUsers: [{ organizationId: 'org-other', status: 'active' }],
    } as unknown as User;

    const signingUpOrganization = { id: 'org-2', name: 'Target Org' } as Organization;
    const userParams = { firstName: 'Attacker', lastName: 'Name', password: 'attacker-chosen-password' };
    const response = {} as any;

    await service.whatIfTheSignUpIsAtTheWorkspaceLevel(
      existingUser,
      signingUpOrganization,
      userParams,
      undefined,
      undefined,
      undefined,
      response
    );

    expect(userRepository.updateOne).not.toHaveBeenCalled();
    expect(sessionUtilService.generateLoginResultPayload).not.toHaveBeenCalled();
  });

  it('still instantly activates + logs in a self-hosted user who proves their existing password', async () => {
    const existingHash = bcrypt.hashSync('correct-password', 10);

    const userRepository = { updateOne: jest.fn() };
    const sessionUtilService = { generateLoginResultPayload: jest.fn().mockResolvedValue({ ok: true }) };
    const organizationUserRepository = {
      createOne: jest.fn().mockResolvedValue({
        organizationId: 'org-2',
        status: 'invited',
        invitationToken: 'org-invite-token',
        invitationTokenExpiry: null,
      }),
    };
    const rolesUtilService = { addUserRole: jest.fn().mockResolvedValue(undefined) };
    const licenseUserService = { validateUser: jest.fn().mockResolvedValue(undefined) };
    const eventEmitter = { emit: jest.fn() };
    const organizationUsersUtilService = { activateOrganization: jest.fn().mockResolvedValue(undefined) };

    const service = makeService({
      userRepository,
      sessionUtilService,
      organizationUserRepository,
      rolesUtilService,
      licenseUserService,
      eventEmitter,
      organizationUsersUtilService,
    });

    const existingUser = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      password: existingHash,
      invitationToken: null,
      organizationUsers: [],
    } as unknown as User;

    const signingUpOrganization = { id: 'org-2', name: 'Target Org' } as Organization;
    const userParams = { firstName: 'User', lastName: 'Name', password: 'correct-password' };
    const response = {} as any;

    await service.whatIfTheSignUpIsAtTheWorkspaceLevel(
      existingUser,
      signingUpOrganization,
      userParams,
      undefined,
      undefined,
      undefined,
      response
    );

    expect(organizationUsersUtilService.activateOrganization).toHaveBeenCalled();
    expect(sessionUtilService.generateLoginResultPayload).toHaveBeenCalled();
  });
});
