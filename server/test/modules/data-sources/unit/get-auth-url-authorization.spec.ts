import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSourcesService } from '../../../../src/modules/data-sources/service';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { AppEnvironmentUtilService } from '../../../../src/modules/app-environments/util.service';
import { User } from '../../../../src/entities/user.entity';
import { GetDataSourceOauthUrlDto } from '../../../../src/modules/data-sources/dto';

const SESSION_ORG = 'org-session';
const OTHER_ORG = 'org-other';
const SESSION_ENV = 'env-session';
const OTHER_ENV = 'env-other';

function setup() {
  const getAuthUrl = jest.fn().mockResolvedValue({ url: 'https://idp.example/auth' });
  const getEnvironment = jest.fn(async (organizationId: string, environmentId: string) => {
    if (organizationId === SESSION_ORG && environmentId === SESSION_ENV) return { id: SESSION_ENV };
    throw new Error('EntityNotFoundError');
  });

  const service = new DataSourcesService(
    {} as unknown as never,
    { getAuthUrl } as unknown as DataSourcesUtilService,
    {} as unknown as never,
    { get: getEnvironment } as unknown as AppEnvironmentUtilService,
    {} as unknown as never,
    {} as unknown as never
  );
  const user = { id: 'user-1', organizationId: SESSION_ORG } as unknown as User;

  return { service, user, getAuthUrl, getEnvironment };
}

const dto = (overrides: Partial<GetDataSourceOauthUrlDto> = {}): GetDataSourceOauthUrlDto => ({
  provider: 'restapi',
  source_options: { client_id: '{{secrets.MARKER}}' },
  plugin_id: null,
  ...overrides,
});

describe('DataSourcesService.getAuthUrl | cross-workspace authorization', () => {
  it('should resolve against the session workspace when organization_id matches', async () => {
    const { service, user, getAuthUrl } = setup();

    await expect(
      service.getAuthUrl(dto({ organization_id: SESSION_ORG, environment_id: SESSION_ENV }), user)
    ).resolves.toMatchObject({ url: expect.any(String) });
    expect(getAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({ organization_id: SESSION_ORG, environment_id: SESSION_ENV })
    );
  });

  it('should use the session workspace when organization_id is omitted', async () => {
    const { service, user, getAuthUrl } = setup();

    await service.getAuthUrl(dto({ environment_id: SESSION_ENV }), user);
    expect(getAuthUrl).toHaveBeenCalledWith(expect.objectContaining({ organization_id: SESSION_ORG }));
  });

  it('should reject with 403 and resolve nothing when organization_id names another workspace', async () => {
    const { service, user, getAuthUrl } = setup();

    await expect(
      service.getAuthUrl(dto({ organization_id: OTHER_ORG, environment_id: OTHER_ENV }), user)
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(getAuthUrl).not.toHaveBeenCalled();
  });

  it('should reject with 404 and resolve nothing when environment_id belongs to another workspace', async () => {
    const { service, user, getAuthUrl, getEnvironment } = setup();

    await expect(
      service.getAuthUrl(dto({ organization_id: SESSION_ORG, environment_id: OTHER_ENV }), user)
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(getEnvironment).toHaveBeenCalledWith(SESSION_ORG, OTHER_ENV);
    expect(getAuthUrl).not.toHaveBeenCalled();
  });

  it('should reject with 404 when environment_id does not exist', async () => {
    const { service, user, getAuthUrl } = setup();

    await expect(service.getAuthUrl(dto({ environment_id: 'missing-env' }), user)).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(getAuthUrl).not.toHaveBeenCalled();
  });
});
