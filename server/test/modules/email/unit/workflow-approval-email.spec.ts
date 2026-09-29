import { EmailService } from '@modules/email/service';

/** @group workflows */
describe('EmailService.sendWorkflowApprovalEmail', () => {
  const makeService = () => {
    const emailUtilService = {
      retrieveWhiteLabelSettings: jest.fn().mockResolvedValue({
        white_label_text: 'Acme Ops',
        white_label_logo: 'https://assets.example.com/acme.png',
        default: false,
      }),
      retrieveSmtpSettings: jest.fn().mockResolvedValue({ SMTP_ENABLED: true }),
      init: jest.fn(),
      compileTemplate: jest.fn().mockReturnValue('<p>approval email</p>'),
      sendEmail: jest.fn(),
      sendEmailWithSettings: jest.fn(),
    };
    const service = new EmailService(emailUtilService as any, {} as any, {} as any);
    (service as any).TOOLJET_HOST = 'https://tooljet.example.com';
    return { service, emailUtilService };
  };

  it('uses workspace whitelabel settings and links the CTA to the approval dashboard', async () => {
    const { service, emailUtilService } = makeService();
    jest.spyOn(service as any, 'getOrganization').mockResolvedValue({ slug: 'acme-workspace' });
    jest.spyOn(service as any, 'getOrganizationHost').mockResolvedValue('https://acme.example.com');

    await service.sendWorkflowApprovalEmail({
      to: ['manager@example.com'],
      organizationId: 'org-1',
      workflowName: 'Production deployment',
      nodeName: 'Manager approval',
      description: 'Review this deployment',
      reminder: false,
    });

    expect(emailUtilService.compileTemplate).toHaveBeenCalledWith(
      'workflow_approval.hbs',
      expect.objectContaining({
        approvalDashboardUrl: 'https://acme.example.com/acme-workspace/workflows/approvals',
        workflowName: 'Production deployment',
        whiteLabelText: 'Acme Ops',
        whiteLabelLogo: 'https://assets.example.com/acme.png',
      })
    );
    expect(emailUtilService.sendEmailWithSettings).toHaveBeenCalledWith(
      'manager@example.com',
      'Approval requested: Production deployment',
      expect.objectContaining({
        bodyContent: '<p>approval email</p>',
        whiteLabelText: 'Acme Ops',
        whiteLabelLogo: 'https://assets.example.com/acme.png',
      }),
      { SMTP_ENABLED: true },
      'Acme Ops'
    );
    expect(emailUtilService.init).not.toHaveBeenCalled();
  });

  it('uses reminder copy for a reminder delivery', async () => {
    const { service, emailUtilService } = makeService();
    jest.spyOn(service as any, 'getOrganization').mockResolvedValue({ slug: 'acme-workspace' });
    jest.spyOn(service as any, 'getOrganizationHost').mockResolvedValue('https://acme.example.com');

    await service.sendWorkflowApprovalEmail({
      to: ['manager@example.com'],
      organizationId: 'org-1',
      workflowName: 'Production deployment',
      nodeName: 'Manager approval',
      description: '',
      reminder: true,
    });

    expect(emailUtilService.sendEmailWithSettings).toHaveBeenCalledWith(
      'manager@example.com',
      'Reminder: approval requested for Production deployment',
      expect.any(Object),
      { SMTP_ENABLED: true },
      'Acme Ops'
    );
  });

  it('sends each approver a private delivery', async () => {
    const { service, emailUtilService } = makeService();
    jest.spyOn(service as any, 'getOrganization').mockResolvedValue({ slug: 'acme-workspace' });
    jest.spyOn(service as any, 'getOrganizationHost').mockResolvedValue('https://acme.example.com');

    await service.sendWorkflowApprovalEmail({
      to: ['first@example.com', 'second@example.com'],
      organizationId: 'org-1',
      workflowName: 'Production deployment',
      nodeName: 'Manager approval',
      description: '',
      reminder: false,
    });

    expect(emailUtilService.sendEmailWithSettings).toHaveBeenCalledTimes(2);
    expect(emailUtilService.sendEmailWithSettings).toHaveBeenNthCalledWith(
      1,
      'first@example.com',
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      'Acme Ops'
    );
    expect(emailUtilService.sendEmailWithSettings).toHaveBeenNthCalledWith(
      2,
      'second@example.com',
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
      'Acme Ops'
    );
  });

  it("keeps each workspace's branding when two approval emails send concurrently", async () => {
    const { service, emailUtilService } = makeService();
    const releaseFirstSettings: { resolve?: () => void } = {};
    jest.spyOn(service as any, 'getOrganization').mockImplementation(async (organizationId: string) => ({
      slug: organizationId === 'org-1' ? 'workspace-one' : 'workspace-two',
    }));
    jest.spyOn(service as any, 'getOrganizationHost').mockResolvedValue('https://tooljet.example.com');
    emailUtilService.retrieveWhiteLabelSettings.mockImplementation(async (organizationId: string) => {
      if (organizationId === 'org-1') {
        await new Promise<void>((resolve) => {
          releaseFirstSettings.resolve = resolve;
        });
      }
      return {
        white_label_text: organizationId === 'org-1' ? 'Brand One' : 'Brand Two',
        white_label_logo: organizationId === 'org-1' ? 'one.png' : 'two.png',
        default: false,
      };
    });

    const first = service.sendWorkflowApprovalEmail({
      to: ['first@example.com'],
      organizationId: 'org-1',
      workflowName: 'First workflow',
      nodeName: 'First approval',
      description: '',
      reminder: false,
    });
    const second = service.sendWorkflowApprovalEmail({
      to: ['second@example.com'],
      organizationId: 'org-2',
      workflowName: 'Second workflow',
      nodeName: 'Second approval',
      description: '',
      reminder: false,
    });
    await new Promise<void>((resolve) => setImmediate(resolve));
    releaseFirstSettings.resolve?.();
    await Promise.all([first, second]);

    expect(emailUtilService.sendEmailWithSettings).toHaveBeenCalledWith(
      'first@example.com',
      expect.any(String),
      expect.objectContaining({ whiteLabelText: 'Brand One', whiteLabelLogo: 'one.png' }),
      expect.any(Object),
      'Brand One'
    );
    expect(emailUtilService.sendEmailWithSettings).toHaveBeenCalledWith(
      'second@example.com',
      expect.any(String),
      expect.objectContaining({ whiteLabelText: 'Brand Two', whiteLabelLogo: 'two.png' }),
      expect.any(Object),
      'Brand Two'
    );
  });
});
