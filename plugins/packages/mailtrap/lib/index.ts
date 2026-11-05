import { ConnectionTestResult, QueryError, QueryResult, QueryService } from '@tooljet-plugins/common';
import { Address, Attachment, FileInput, QueryOptions, SendPayload, SourceOptions } from './types';

const SEND_URLS = {
  transactional: 'https://send.api.mailtrap.io/api/send',
  bulk: 'https://bulk.api.mailtrap.io/api/send',
  sandbox: 'https://sandbox.api.mailtrap.io/api/send',
};
const ACCOUNTS_URL = 'https://mailtrap.io/api/accounts';

export default class Mailtrap implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, _dataSourceId?: string): Promise<QueryResult> {
    if (!sourceOptions?.api_token) {
      throw new QueryError('Query could not be completed', 'Mailtrap API token is not set', {});
    }

    const url = this.sendUrl(sourceOptions);
    const payload = this.buildPayload(queryOptions);

    const { ok, status, body } = await this.request(url, sourceOptions.api_token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!ok) {
      throw new QueryError('Query could not be completed', this.errorMessage(status, body), {
        statusCode: status,
        responseBody: body,
      });
    }

    return {
      status: 'ok',
      data: body,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    if (!sourceOptions?.api_token) {
      throw new Error('Mailtrap API token is not set');
    }
    if (sourceOptions.sending_stream === 'sandbox' && !sourceOptions.inbox_id) {
      throw new Error('Inbox ID is required for the Sandbox sending stream');
    }

    const { ok, status, body } = await this.request(ACCOUNTS_URL, sourceOptions.api_token, { method: 'GET' });
    if (!ok) {
      throw new Error(this.errorMessage(status, body));
    }

    return { status: 'ok' };
  }

  private sendUrl(sourceOptions: SourceOptions): string {
    const stream = sourceOptions.sending_stream || 'transactional';

    if (stream === 'sandbox') {
      const inboxId = String(sourceOptions.inbox_id ?? '').trim();
      if (!inboxId) {
        throw new QueryError('Query could not be completed', 'Inbox ID is required for the Sandbox sending stream', {});
      }
      return `${SEND_URLS.sandbox}/${encodeURIComponent(inboxId)}`;
    }

    const url = SEND_URLS[stream];
    if (!url) {
      throw new QueryError('Query could not be completed', `Unknown sending stream: ${stream}`, {});
    }
    return url;
  }

  buildPayload(queryOptions: QueryOptions): SendPayload {
    const { operation } = queryOptions;
    if (operation !== 'send_email' && operation !== 'send_template_email') {
      throw new QueryError('Query could not be completed', `Unsupported operation: ${operation}`, {});
    }

    const fromEmail = String(queryOptions.from_email ?? '').trim();
    if (!fromEmail) {
      throw new QueryError('Query could not be completed', 'Sender email is required', {});
    }
    const fromName = String(queryOptions.from_name ?? '').trim();

    const to = toAddressList(queryOptions.to);
    if (!to?.length) {
      throw new QueryError('Query could not be completed', 'At least one recipient is required', {});
    }

    const payload: SendPayload = {
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      to,
    };

    const cc = toAddressList(queryOptions.cc);
    if (cc?.length) payload.cc = cc;
    const bcc = toAddressList(queryOptions.bcc);
    if (bcc?.length) payload.bcc = bcc;
    const replyTo = toAddressList(queryOptions.reply_to);
    if (replyTo?.length) payload.reply_to = replyTo[0];

    const customVariables = toObject(queryOptions.custom_variables, 'Custom variables');
    if (customVariables) payload.custom_variables = customVariables;
    const attachments = toAttachments(queryOptions.attachments);
    if (attachments?.length) payload.attachments = attachments;

    if (operation === 'send_template_email') {
      const templateUuid = String(queryOptions.template_uuid ?? '').trim();
      if (!templateUuid) {
        throw new QueryError('Query could not be completed', 'Template UUID is required', {});
      }
      payload.template_uuid = templateUuid;
      const templateVariables = toObject(queryOptions.template_variables, 'Template variables');
      if (templateVariables) payload.template_variables = templateVariables;
      return payload;
    }

    if (!queryOptions.subject) {
      throw new QueryError('Query could not be completed', 'Subject is required', {});
    }
    if (!queryOptions.text && !queryOptions.html) {
      throw new QueryError('Query could not be completed', 'Either a text or an HTML body is required', {});
    }
    payload.subject = queryOptions.subject;
    if (queryOptions.text) payload.text = queryOptions.text;
    if (queryOptions.html) payload.html = queryOptions.html;
    if (queryOptions.category) payload.category = queryOptions.category;
    const headers = toObject(queryOptions.headers, 'Headers');
    if (headers) payload.headers = headers;

    return payload;
  }

  private async request(
    url: string,
    apiToken: string,
    init: { method: string; body?: string }
  ): Promise<{ ok: boolean; status: number; body: any }> {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    } catch (error) {
      throw new QueryError('Query could not be completed', `Could not reach Mailtrap: ${error.message}`, {});
    }

    const raw = await response.text();
    let body: any = raw;
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      // Non-JSON body (e.g. a gateway error page); surface it as text.
    }

    return { ok: response.ok, status: response.status, body };
  }

  private errorMessage(status: number, body: any): string {
    if (Array.isArray(body?.errors) && body.errors.length) {
      return body.errors.join('; ');
    }
    if (typeof body?.errors === 'string') return body.errors;
    if (typeof body?.error === 'string') return body.error;
    if (typeof body === 'string' && body) return `Mailtrap responded with ${status}: ${body}`;
    return `Mailtrap responded with status ${status}`;
  }
}

// Accepts an email string, "Name <email>", a comma-separated string, a JSON array string,
// or an array of strings / { email, name } objects.
export function toAddressList(value: unknown): Address[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  let items: unknown[];
  if (Array.isArray(value)) {
    items = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('[')) {
      try {
        items = JSON.parse(trimmed);
      } catch {
        throw new QueryError('Query could not be completed', `Invalid recipient list: ${trimmed}`, {});
      }
    } else {
      items = trimmed.split(',');
    }
  } else {
    items = [value];
  }

  return items.map(toAddress).filter(Boolean);
}

function toAddress(item: unknown): Address | undefined {
  if (item && typeof item === 'object') {
    const { email, name } = item as Address;
    if (!email) {
      throw new QueryError(
        'Query could not be completed',
        `Recipient is missing an email: ${JSON.stringify(item)}`,
        {}
      );
    }
    return name ? { email: String(email).trim(), name: String(name) } : { email: String(email).trim() };
  }

  const str = String(item ?? '').trim();
  if (!str) return undefined;

  const match = str.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^"(.*)"$/, '$1');
    const email = match[2].trim();
    return name ? { email, name } : { email };
  }
  return { email: str };
}

function toObject(value: unknown, label: string): Record<string, unknown> | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new QueryError('Query could not be completed', `${label} must be a JSON object`, {});
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new QueryError('Query could not be completed', `${label} must be a JSON object`, {});
  }
  return Object.keys(parsed).length ? (parsed as Record<string, unknown>) : undefined;
}

// Accepts File Picker output ({{components.filepicker1.files}}) or Mailtrap-shaped
// { filename, content (base64), type, disposition } objects.
export function toAttachments(value: unknown): Attachment[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  let items = value;
  if (typeof value === 'string') {
    try {
      items = JSON.parse(value);
    } catch {
      throw new QueryError('Query could not be completed', 'Attachments must be an array of files', {});
    }
  }
  if (!Array.isArray(items)) items = [items];

  return (items as FileInput[]).map((file, index) => {
    const filename = file?.filename ?? file?.name;
    // File Picker exposes the raw text as `content`; only fall back to it for Mailtrap-shaped input.
    const base64 = file?.base64Data ?? file?.dataURL ?? (file?.filename ? file?.content : undefined);
    if (!filename || !base64) {
      throw new QueryError(
        'Query could not be completed',
        `Attachment #${index + 1} must have a file name and base64 content`,
        {}
      );
    }

    const attachment: Attachment = { filename, content: stripDataUrlPrefix(base64) };
    if (file.type) attachment.type = file.type;
    const disposition = (file as Attachment).disposition;
    if (disposition) attachment.disposition = disposition;
    return attachment;
  });
}

function stripDataUrlPrefix(content: string): string {
  const commaIndex = content.indexOf(',');
  return content.startsWith('data:') && commaIndex !== -1 ? content.slice(commaIndex + 1) : content;
}
