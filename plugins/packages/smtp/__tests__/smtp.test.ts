import nodemailer from 'nodemailer';
import Smtp from '../lib';

jest.mock('@tooljet-plugins/common', () => ({
  ...jest.requireActual('@tooljet-plugins/common'),
  validateUrlForSSRF: jest.fn().mockResolvedValue(undefined),
}));

const realCreateTransport = nodemailer.createTransport.bind(nodemailer);
let createTransportSpy: jest.SpyInstance;
let sendMailSpy: jest.SpyInstance | undefined;

const sourceOptions = { host: 'smtp.example.com', port: '587', user: 'u', password: 'p' };
const baseQuery = {
  operation: 'send_mail',
  from: 'a@example.com',
  from_name: 'Alice',
  to: 'b@example.com',
  cc: [] as string[],
  bcc: [] as string[],
  subject: 'Hi',
  textContent: 'hello',
  htmlContent: '<p>hello</p>',
};

beforeEach(() => {
  sendMailSpy = undefined;
  // Real streamTransport (no network) built with the same defaults the plugin passes.
  createTransportSpy = jest.spyOn(nodemailer, 'createTransport').mockImplementation(((_opts: any, defaults: any) => {
    const t = realCreateTransport({ streamTransport: true, buffer: true } as any, defaults);
    sendMailSpy = jest.spyOn(t, 'sendMail');
    return t;
  }) as any);
});
afterEach(() => jest.restoreAllMocks());

const run = (q: object) => new Smtp().run(sourceOptions, { ...baseQuery, ...q } as any, 'ds-id');

describe('SMTP connector content hardening', () => {
  it('creates the transport with file and URL access disabled', async () => {
    await run({});
    expect(createTransportSpy.mock.calls[0][1]).toMatchObject({ disableFileAccess: true, disableUrlAccess: true });
  });

  it('passes a normal string message through unchanged', async () => {
    await expect(run({})).resolves.toMatchObject({ status: 'ok' });
    expect(sendMailSpy!.mock.calls[0][0]).toMatchObject({
      from: { name: 'Alice', address: 'a@example.com' },
      to: 'b@example.com',
      subject: 'Hi',
      text: 'hello',
      html: '<p>hello</p>',
    });
  });

  it('accepts arrays of strings for recipients', async () => {
    await run({ to: ['b@example.com', 'c@example.com'], cc: ['d@example.com'] });
    expect(sendMailSpy!.mock.calls[0][0]).toMatchObject({ to: ['b@example.com', 'c@example.com'], cc: ['d@example.com'] });
  });

  it('still sends base64 attachments', async () => {
    const dataURL = Buffer.from('file body').toString('base64');
    await expect(run({ attachment_array: [{ name: 'a.txt', dataURL }] })).resolves.toMatchObject({ status: 'ok' });
    const sent = sendMailSpy!.mock.calls[0][0];
    expect(sent.attachments[0]).toMatchObject({ filename: 'a.txt' });
    expect(Buffer.isBuffer(sent.attachments[0].content)).toBe(true);
  });

  it.each(['textContent', 'htmlContent', 'subject', 'from', 'from_name'])(
    'rejects an object in %s without sending',
    async (field) => {
      await expect(run({ [field]: { path: '/etc/passwd' } })).rejects.toThrow();
      expect(sendMailSpy!).not.toHaveBeenCalled();
    }
  );

  it.each(['to', 'cc', 'bcc'])('rejects non-string recipients in %s', async (field) => {
    await expect(run({ [field]: [{ path: '/etc/passwd' }] })).rejects.toThrow();
    await expect(run({ [field]: { href: 'http://127.0.0.1/' } })).rejects.toThrow();
  });

  it('transport refuses file and URL content objects even if coercion were bypassed', async () => {
    const t = realCreateTransport({ streamTransport: true, buffer: true } as any, {
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await expect(t.sendMail({ to: 'b@example.com', text: { path: '/etc/passwd' } as any })).rejects.toThrow(/access rejected/i);
    await expect(t.sendMail({ to: 'b@example.com', html: { href: 'http://127.0.0.1:1/' } as any })).rejects.toThrow(/access rejected/i);
  });
});
