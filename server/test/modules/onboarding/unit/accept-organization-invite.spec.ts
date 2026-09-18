// acceptOrganizationInvite calls dbTransactionWrap with no manager, which opens a real DB
// transaction outside a unit test's reach — stub it to just invoke the callback, matching
// test/modules/git-sync-configs/unit/service.spec.ts.
let currentManager: any;
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any, manager?: any) => operation(manager ?? currentManager)),
}));

import { NotAcceptableException } from '@nestjs/common';
import { OnboardingService } from '@modules/onboarding/service';
import { User } from '@entities/user.entity';

function makeService(userRepository: any) {
  return new OnboardingService(
    userRepository,
    {} as any, // onboardingUtilService
    {} as any, // sessionUtilService
    {} as any, // organizationUsersRepository
    {} as any, // organizationRepository
    {} as any, // configService
    {} as any, // licenseUtilService
    {} as any, // licenseCountsService
    {} as any, // eventEmitter
    {} as any, // organizationUsersUtilService
    {} as any, // licenseUserService
    {} as any, // instanceSettingsUtilService
    {} as any, // metadataUtilService
    {} as any // setupOrganizationsUtilService
  );
}

function makeOrganizationUser(userEmail: string) {
  return {
    invitationToken: 'org-invite-token',
    invitationTokenExpiry: null,
    organizationId: 'org-1',
    user: { id: 'victim-1', email: userEmail, invitationToken: null } as unknown as User,
  };
}

describe('OnboardingService.acceptOrganizationInvite — GHSA-392x session theft guard', () => {
  it('rejects accepting an invite whose target user differs from the logged-in caller', async () => {
    currentManager = { findOne: jest.fn().mockResolvedValue(makeOrganizationUser('victim@example.com')) };
    const userRepository = { updateOne: jest.fn() };
    const service = makeService(userRepository);
    const loggedInUser = { id: 'attacker-1', email: 'attacker@example.com' } as User;

    await expect(
      service.acceptOrganizationInvite(undefined as any, loggedInUser, { token: 'org-invite-token' } as any)
    ).rejects.toThrow(NotAcceptableException);

    expect(userRepository.updateOne).not.toHaveBeenCalled();
  });

  it('lets the invited user accept their own invite (case-insensitive email match)', async () => {
    currentManager = { findOne: jest.fn().mockResolvedValue(makeOrganizationUser('Victim@Example.com')) };
    const userRepository = { updateOne: jest.fn().mockRejectedValue(new Error('STOP_HERE_PAST_GUARD')) };
    const service = makeService(userRepository);
    const loggedInUser = { id: 'victim-1', email: 'victim@example.com' } as User;

    await expect(
      service.acceptOrganizationInvite(undefined as any, loggedInUser, { token: 'org-invite-token' } as any)
    ).rejects.toThrow('STOP_HERE_PAST_GUARD');

    expect(userRepository.updateOne).toHaveBeenCalled();
  });
});
