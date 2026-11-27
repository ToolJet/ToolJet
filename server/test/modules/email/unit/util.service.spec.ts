/**
 * Unit tests for EmailUtilService.sendSelfhostLicensePurchaseEmail — the branded email sent to
 * self-hosted customers after a Stripe checkout completes (see
 * server/ee/organization-payments/service.ts, webhookCheckoutSessionCompleteHandler).
 *
 * sendEmail itself (real SMTP/transport wiring) is mocked out; only the subject/body/recipient it
 * is called with are asserted, using the real compileTemplate against the actual .hbs file.
 */

import { EmailUtilService } from '../../../../src/modules/email/util.service';

function makeService(): EmailUtilService {
  const whiteLabellingUtilService = {} as any;
  const smtpUtilService = {} as any;
  const configService = { get: jest.fn() } as any;
  const logger = { log: jest.fn() } as any;
  return new EmailUtilService(whiteLabellingUtilService, smtpUtilService, configService, logger);
}

describe('EmailUtilService.sendSelfhostLicensePurchaseEmail', () => {
  it('does not send an email when "to" is falsy', async () => {
    const service = makeService();
    const sendEmail = jest.spyOn(service, 'sendEmail').mockResolvedValue(undefined);

    await service.sendSelfhostLicensePurchaseEmail(undefined as any, 'Jane Doe');

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('sends the email with the expected recipient, subject, and templated body', async () => {
    const service = makeService();
    const sendEmail = jest.spyOn(service, 'sendEmail').mockResolvedValue(undefined);

    await service.sendSelfhostLicensePurchaseEmail('customer@example.com', 'Jane Doe');

    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [to, subject, templateData] = sendEmail.mock.calls[0];
    expect(to).toBe('customer@example.com');
    expect(subject).toBe('Action needed - one thing we need before your license is ready');
    expect(templateData.bodyContent).toEqual(expect.stringContaining('Jane Doe'));
  });
});
