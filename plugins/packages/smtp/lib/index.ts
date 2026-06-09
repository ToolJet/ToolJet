import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import nodemailer, { Transporter } from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';

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
        name: from_name,
        address: from,
      },
      to,
      cc,
      bcc,
      subject,
      text: textContent,
      html: htmlContent,
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

    const transport: Transporter = nodemailer.createTransport({
      port,
      host,
      secure: port === 465,
      auth: {
        user,
        pass: password,
      },
    });

    return transport;
  }
}
