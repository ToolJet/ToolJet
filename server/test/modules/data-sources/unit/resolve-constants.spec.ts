import { Test, TestingModule } from '@nestjs/testing';
import { DataSourcesUtilService } from '../../../../src/modules/data-sources/util.service';
import { AppEnvironmentUtilService } from '../../../../src/modules/app-environments/util.service';
import { CredentialsService } from '../../../../src/modules/encryption/services/credentials.service';
import { DataSourcesRepository } from '../../../../src/modules/data-sources/repository';
import { LicenseTermsService } from '../../../../src/modules/licensing/interfaces/IService';
import { EncryptionService } from '../../../../src/modules/encryption/service';
import { PluginsServiceSelector } from '../../../../src/modules/data-sources/services/plugin-selector.service';
import { OrganizationConstantsUtilService } from '../../../../src/modules/organization-constants/util.service';
import { InMemoryCacheService } from '../../../../src/modules/inMemoryCache/in-memory-cache.service';
import { GitSyncConfigsUtilService } from '../../../../src/modules/git-sync-configs/util.service';
import { OrganizationConstantType } from '../../../../src/modules/organization-constants/constants';

describe('DataSourcesUtilService - resolveConstants', () => {
  let service: DataSourcesUtilService;
  let organizationConstantsUtilService: { getOrgEnvironmentConstant: jest.Mock };
  let encryptionService: { decryptColumnValue: jest.Mock };

  beforeEach(async () => {
    organizationConstantsUtilService = {
      getOrgEnvironmentConstant: jest.fn(),
    };
    encryptionService = {
      decryptColumnValue: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourcesUtilService,
        {
          provide: AppEnvironmentUtilService,
          useValue: { getOptions: jest.fn() },
        },
        {
          provide: CredentialsService,
          useValue: {},
        },
        {
          provide: DataSourcesRepository,
          useValue: {},
        },
        {
          provide: LicenseTermsService,
          useValue: {},
        },
        {
          provide: EncryptionService,
          useValue: encryptionService,
        },
        {
          provide: PluginsServiceSelector,
          useValue: { getService: jest.fn() },
        },
        {
          provide: OrganizationConstantsUtilService,
          useValue: organizationConstantsUtilService,
        },
        {
          provide: InMemoryCacheService,
          useValue: {},
        },
        {
          provide: GitSyncConfigsUtilService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DataSourcesUtilService>(DataSourcesUtilService);
  });

  // Resolves any constant/secret lookup to the given plaintext.
  const mockConstant = (decryptedValue: string) => {
    organizationConstantsUtilService.getOrgEnvironmentConstant.mockResolvedValue({
      value: 'encrypted',
    });
    encryptionService.decryptColumnValue.mockResolvedValue(decryptedValue);
  };

  it('inserts a secret literally even when it contains $$', async () => {
    mockConstant('ab$$cd');

    const result = await service.resolveConstants('{{secrets.DB_PASS}}', 'org-id', 'env-id');

    expect(result).toBe('ab$$cd');
  });

  it('inserts a secret literally when it contains $&', async () => {
    mockConstant('p$&q');

    const result = await service.resolveConstants('prefix-{{secrets.DB_PASS}}-suffix', 'org-id', 'env-id');

    expect(result).toBe('prefix-p$&q-suffix');
  });

  it("inserts a secret literally when it contains $` and $'", async () => {
    mockConstant("$`and$'");

    const result = await service.resolveConstants('{{secrets.DB_PASS}}', 'org-id', 'env-id');

    expect(result).toBe("$`and$'");
  });

  it('resolves multiple secrets independently and literally', async () => {
    organizationConstantsUtilService.getOrgEnvironmentConstant.mockImplementation(async (_key, _org, _env, type) => {
      // return a distinct encrypted placeholder per type
      return { value: type === OrganizationConstantType.SECRET ? 'secret-encrypted' : 'constant-encrypted' };
    });
    encryptionService.decryptColumnValue.mockImplementation(async (_table, _org, value) =>
      value === 'secret-encrypted' ? 'a$$b' : 'c$&d'
    );

    const result = await service.resolveConstants('{{secrets.S}}:{{constants.C}}', 'org-id', 'env-id');

    expect(result).toBe('a$$b:c$&d');
  });

  it('resolves secrets and constants as their respective types', async () => {
    mockConstant('value');

    await service.resolveConstants('{{secrets.S}}:{{constants.C}}', 'org-id', 'env-id');

    expect(organizationConstantsUtilService.getOrgEnvironmentConstant).toHaveBeenCalledWith(
      'S',
      'org-id',
      'env-id',
      OrganizationConstantType.SECRET
    );
    expect(organizationConstantsUtilService.getOrgEnvironmentConstant).toHaveBeenCalledWith(
      'C',
      'org-id',
      'env-id',
      OrganizationConstantType.GLOBAL
    );
  });

  it('leaves unmatched placeholders untouched', async () => {
    const result = await service.resolveConstants('plain-value', 'org-id', 'env-id');

    expect(result).toBe('plain-value');
    expect(organizationConstantsUtilService.getOrgEnvironmentConstant).not.toHaveBeenCalled();
  });
});
