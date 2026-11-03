import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
  validateUrlForSSRF,
} from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import nodemailer, { Transporter } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import type { Address } from 'nodemailer/lib/mailer';

// Message fields come from builder-controlled query options and are untyped at runtime.
// Nodemailer treats `{ path }` / `{ href }` objects as "read this local file / fetch this URL",
// so only plain strings, or for recipients `{ name, address }` address objects and arrays of either, are ever handed to it.
const toMailString = (value: unknown, field: string): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new QueryError('Query could not be completed', `${field} must be a string`, {});
};

const toMailAddress = (value: unknown, field: string): string | Address => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).every((k) => k === 'name' || k === 'address') &&
    typeof (value as any).address === 'string' &&
    ((value as any).name === undefined || typeof (value as any).name === 'string')
  ) {
    return value as Address;
  }
  return toMailString(value, field) as string;
};

const toMailAddresses = (value: unknown, field: string) => {
  if (Array.isArray(value)) return value.map((v, i) => toMailAddress(v, `${field}[${i}]`));
  if (value === undefined || value === null) return undefined;
  return toMailAddress(value, field);
};

export default class Smtp implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const nodemailerTransport: Transporter = await this.getConnection(sourceOptions);
    const { from, to, cc, bcc, from_name, subject, textContent, htmlContent } = queryOptions;
    const attachments: { name: string; dataURL: string }[] | undefined =
      queryOptions['attachment_array'] && typeof queryOptions['attachment_array'] === 'string'
        ? JSON.parse(queryOptions['attachment_array'])
        : queryOptions['attachment_array'];

    const filesData = (array: { name: string; dataURL: string }[]): Attachment[] => {
      const newFiles = array.map((x) => {
        return { filename: x.name, content: Buffer.from(x.dataURL, 'base64') };
      });
      return newFiles;
    };

    const mailOptions = {
      from: {
        name: toMailString(from_name, 'From name'),
        address: toMailString(from, 'From'),
      },
      to: toMailAddresses(to, 'To'),
      cc: toMailAddresses(cc, 'CC'),
      bcc: toMailAddresses(bcc, 'BCC'),
      subject: toMailString(subject, 'Subject'),
      text: toMailString(textContent, 'Text content'),
      html: toMailString(htmlContent, 'HTML content'),
      attachments: attachments && filesData(attachments),
    };

    try {
      await nodemailerTransport.sendMail(mailOptions);
    } catch (error) {
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const transporter: Transporter = await this.getConnection(sourceOptions);

    if (!transporter) {
      throw new Error('Invalid credentials');
    }

    try {
      await transporter.verify();
    } catch (err) {
      throw new Error('Invalid credentials');
    }

    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<Transporter> {
    const { host, user, password } = sourceOptions;
    const port = Number(sourceOptions.port);

    // SSRF Protection: this opens a real socket to an arbitrary internal host/port
    // via the SMTP protocol. Not an HTTP request, so we validate the host through
    // the same IP/hostname checks as any other sink (scheme is irrelevant here).
    // Covers both run() and testConnection(), which both go through this method.
    await validateUrlForSSRF(`https://${host}:${port}`);

    // Defense in depth: never let message content read local files or fetch URLs.
    const transport: Transporter = nodemailer.createTransport(
      {
        port,
        host,
        secure: port === 465,
        auth: {
          user,
          pass: password,
        },
      },
      { disableFileAccess: true, disableUrlAccess: true }
    );

    return transport;
  }
}
