/**
 * @group platform
 *
 * PUT /v2/apps/:id/versions/:versionId/global_settings saved `globalSettings.variables` as sent, and
 * the editor cannot load a malformed declared-variables map. updateSettings rejects one before
 * anything is read or written.
 */
import { BadRequestException } from '@nestjs/common';
import { VersionService } from 'src/modules/versions/service';
import { App } from 'src/entities/app.entity';
import { User } from 'src/entities/user.entity';

describe('VersionService.updateSettings', () => {
  const versionRepository = { findById: jest.fn() };
  const versionsUtilService = { updateVersion: jest.fn() };
  const service = new VersionService(
    versionRepository as unknown as ConstructorParameters<typeof VersionService>[0],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    versionsUtilService as unknown as ConstructorParameters<typeof VersionService>[8],
    undefined,
    undefined,
    undefined,
    undefined
  );
  const app = { id: 'app-1', appVersions: [{ id: 'version-1' }] } as unknown as App;
  const user = { id: 'user-1', organizationId: 'org-1' } as unknown as User;

  afterEach(() => jest.resetAllMocks());

  it.each([
    ['a null entry', { bad: null }],
    ['an entry with a non-string value', { bad: { id: 'b', name: 'x', value: 5, fxActive: false } }],
    ['a map that is not an object', 'x'],
  ])('rejects %s with a 400 and saves nothing', async (_label, variables) => {
    await expect(service.updateSettings(app, user, { globalSettings: { variables } })).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(versionRepository.findById).not.toHaveBeenCalled();
    expect(versionsUtilService.updateVersion).not.toHaveBeenCalled();
  });
});
