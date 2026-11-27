/** @group platform */
import { ForbiddenException } from '@nestjs/common';
import { readdirSync } from 'fs';
import * as path from 'path';
import { TemplatesService } from '../../../../src/modules/templates/service';

const TEMPLATE_ID = readdirSync(path.join(__dirname, '../../../../templates'), { withFileTypes: true }).find((d) =>
  d.isDirectory()
)!.name;
const ORG_ID = 'org-1';
const DEFAULT_BRANCH_ID = 'branch-default';
const FEATURE_BRANCH_ID = 'branch-feature';

type GitDetails = { isEnabled: boolean; isMultiBranchingEnabled: boolean; options: { defaultBranch: { id: string } } };

const buildService = (details: GitDetails) => {
  const gitSyncConfigsUtilService = {
    getDetails: jest.fn().mockResolvedValue(details),
    isGitEditLocked: jest.fn().mockResolvedValue(false),
  };
  const licenseTermsService = { getLicenseTerms: jest.fn().mockResolvedValue(true) };
  const pluginsService = { autoInstallPluginsForTemplates: jest.fn() };
  // The git-sync resolver is the 7th constructor argument.
  const Ctor = TemplatesService as unknown as new (...args: unknown[]) => TemplatesService;
  const service = new Ctor(
    null,
    null,
    null,
    pluginsService,
    { error: jest.fn() },
    licenseTermsService,
    gitSyncConfigsUtilService
  );
  const importTemplate = jest.spyOn(service, 'importTemplate').mockResolvedValue({ app: [] } as never);
  return { service, importTemplate, pluginsService };
};

const multiBranch: GitDetails = {
  isEnabled: true,
  isMultiBranchingEnabled: true,
  options: { defaultBranch: { id: DEFAULT_BRANCH_ID } },
};

describe('TemplatesService.perform | default branch lock', () => {
  it('should reject a create on the default branch of a multi-branch workspace', async () => {
    const { service, importTemplate, pluginsService } = buildService(multiBranch);
    const user = { organizationId: ORG_ID, branchId: DEFAULT_BRANCH_ID };

    await expect(service.perform(user as never, TEMPLATE_ID, 'App', [], false)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(importTemplate).not.toHaveBeenCalled();
    expect(pluginsService.autoInstallPluginsForTemplates).not.toHaveBeenCalled();
  });

  it('should reject when no branch was sent and the request resolved to the default branch', async () => {
    const { service, importTemplate } = buildService(multiBranch);
    const user = { organizationId: ORG_ID, branchId: DEFAULT_BRANCH_ID };

    await expect(service.perform(user as never, TEMPLATE_ID, 'App', [], false)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(importTemplate).not.toHaveBeenCalled();
  });

  it('should create on a feature branch, importing into the resolved branch', async () => {
    const { service, importTemplate } = buildService(multiBranch);
    const user = { organizationId: ORG_ID, branchId: FEATURE_BRANCH_ID };

    await service.perform(user as never, TEMPLATE_ID, 'App', [], false);

    expect(importTemplate).toHaveBeenCalledWith(user, expect.anything(), 'App', TEMPLATE_ID, FEATURE_BRANCH_ID);
  });

  it('should create on the default branch when multi-branching is off', async () => {
    const { service, importTemplate } = buildService({ ...multiBranch, isMultiBranchingEnabled: false });
    const user = { organizationId: ORG_ID, branchId: DEFAULT_BRANCH_ID };

    await service.perform(user as never, TEMPLATE_ID, 'App', [], false);

    expect(importTemplate).toHaveBeenCalled();
  });
});
