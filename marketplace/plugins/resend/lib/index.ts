import {
  QueryError,
  QueryResult,
  QueryService,
  ConnectionTestResult,
} from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions } from './types';

export default class ResendService implements QueryService {
  private readonly baseUrl = 'https://api.resend.com';

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ToolJet-Marketplace-Resend/1.0.0',
    };
  }

  private async request(
    apiKey: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    data?: any,
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.getHeaders(apiKey);

    const init: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      init.body = JSON.stringify(data);
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (networkError: any) {
      throw new QueryError(
        'Network error',
        networkError?.message || 'Failed to connect to Resend API',
        { originalError: networkError },
      );
    }

    let responseBody: any = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        responseBody = await response.json();
      } catch (parseErr) {
        responseBody = null;
      }
    } else {
      try {
        responseBody = await response.text();
      } catch {
        responseBody = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        responseBody?.message ||
        responseBody?.error ||
        `Resend API error (${response.status}: ${response.statusText})`;

      const errorDetails = {
        statusCode: response.status,
        name: responseBody?.name || 'ResendApiError',
        message: errorMessage,
        raw: responseBody,
      };

      throw new QueryError(
        'Query could not be completed',
        errorMessage,
        errorDetails,
      );
    }

    return responseBody;
  }

  async run(
    sourceOptions: SourceOptions,
    queryOptions: QueryOptions,
    _dataSourceId?: string,
  ): Promise<QueryResult> {
    const { apiKey } = sourceOptions || {};
    if (!apiKey) {
      throw new QueryError(
        'Invalid configuration',
        'API key is required for Resend datasource',
        { missing: 'apiKey' },
      );
    }

    const { operation } = queryOptions || {};
    let result: any = null;

    try {
      switch (operation) {
        case 'send_email': {
          const payload: any = {
            from: queryOptions.from,
            to: Array.isArray(queryOptions.to)
              ? queryOptions.to
              : typeof queryOptions.to === 'string' &&
                queryOptions.to.includes(',')
              ? queryOptions.to.split(',').map((e: string) => e.trim())
              : [queryOptions.to],
            subject: queryOptions.subject,
          };

          if (queryOptions.html) payload.html = queryOptions.html;
          if (queryOptions.text) payload.text = queryOptions.text;

          if (queryOptions.cc) {
            payload.cc = Array.isArray(queryOptions.cc)
              ? queryOptions.cc
              : typeof queryOptions.cc === 'string' &&
                queryOptions.cc.includes(',')
              ? queryOptions.cc.split(',').map((e: string) => e.trim())
              : [queryOptions.cc];
          }

          if (queryOptions.bcc) {
            payload.bcc = Array.isArray(queryOptions.bcc)
              ? queryOptions.bcc
              : typeof queryOptions.bcc === 'string' &&
                queryOptions.bcc.includes(',')
              ? queryOptions.bcc.split(',').map((e: string) => e.trim())
              : [queryOptions.bcc];
          }

          if (queryOptions.reply_to) {
            payload.reply_to = queryOptions.reply_to;
          }

          if (queryOptions.scheduled_at) {
            payload.scheduled_at = queryOptions.scheduled_at;
          }

          if (queryOptions.attachments) {
            payload.attachments =
              typeof queryOptions.attachments === 'string'
                ? JSON.parse(queryOptions.attachments)
                : queryOptions.attachments;
          }

          result = await this.request(apiKey, '/emails', 'POST', payload);
          break;
        }

        case 'send_batch_emails': {
          const batchPayload =
            typeof queryOptions.batch === 'string'
              ? JSON.parse(queryOptions.batch)
              : queryOptions.batch;

          result = await this.request(
            apiKey,
            '/emails/batch',
            'POST',
            batchPayload,
          );
          break;
        }

        case 'get_email': {
          const emailId = queryOptions.email_id;
          if (!emailId) {
            throw new QueryError(
              'Missing parameter',
              'Email ID is required to retrieve an email',
              { missing: 'email_id' },
            );
          }
          result = await this.request(apiKey, `/emails/${emailId}`, 'GET');
          break;
        }

        case 'update_scheduled_email': {
          const emailId = queryOptions.email_id;
          if (!emailId) {
            throw new QueryError(
              'Missing parameter',
              'Email ID is required to update a scheduled email',
              { missing: 'email_id' },
            );
          }
          result = await this.request(apiKey, `/emails/${emailId}`, 'PATCH', {
            scheduled_at: queryOptions.scheduled_at,
          });
          break;
        }

        case 'cancel_scheduled_email': {
          const emailId = queryOptions.email_id;
          if (!emailId) {
            throw new QueryError(
              'Missing parameter',
              'Email ID is required to cancel a scheduled email',
              { missing: 'email_id' },
            );
          }
          result = await this.request(
            apiKey,
            `/emails/${emailId}/cancel`,
            'POST',
          );
          break;
        }

        case 'list_domains': {
          result = await this.request(apiKey, '/domains', 'GET');
          break;
        }

        case 'create_domain': {
          const payload: any = {
            name: queryOptions.name,
          };
          if (queryOptions.region) {
            payload.region = queryOptions.region;
          }
          result = await this.request(apiKey, '/domains', 'POST', payload);
          break;
        }

        case 'verify_domain': {
          const domainId = queryOptions.domain_id;
          if (!domainId) {
            throw new QueryError(
              'Missing parameter',
              'Domain ID is required to verify a domain',
              { missing: 'domain_id' },
            );
          }
          result = await this.request(
            apiKey,
            `/domains/${domainId}/verify`,
            'POST',
          );
          break;
        }

        case 'list_contacts': {
          const audienceId = queryOptions.audience_id;
          if (!audienceId) {
            throw new QueryError(
              'Missing parameter',
              'Audience ID is required to list contacts',
              { missing: 'audience_id' },
            );
          }
          result = await this.request(
            apiKey,
            `/audiences/${audienceId}/contacts`,
            'GET',
          );
          break;
        }

        case 'create_contact': {
          const audienceId = queryOptions.audience_id;
          if (!audienceId) {
            throw new QueryError(
              'Missing parameter',
              'Audience ID is required to create a contact',
              { missing: 'audience_id' },
            );
          }
          const payload: any = {
            email: queryOptions.email,
          };
          if (queryOptions.first_name) {
            payload.first_name = queryOptions.first_name;
          }
          if (queryOptions.last_name) {
            payload.last_name = queryOptions.last_name;
          }
          if (queryOptions.unsubscribed !== undefined) {
            payload.unsubscribed =
              queryOptions.unsubscribed === true ||
              queryOptions.unsubscribed === 'true';
          }
          result = await this.request(
            apiKey,
            `/audiences/${audienceId}/contacts`,
            'POST',
            payload,
          );
          break;
        }

        case 'update_contact': {
          const audienceId = queryOptions.audience_id;
          const contactId = queryOptions.contact_id;
          if (!audienceId || !contactId) {
            throw new QueryError(
              'Missing parameter',
              'Audience ID and Contact ID are required to update a contact',
              { missing: { audienceId: !audienceId, contactId: !contactId } },
            );
          }
          const payload: any = {};
          if (queryOptions.first_name) {
            payload.first_name = queryOptions.first_name;
          }
          if (queryOptions.last_name) {
            payload.last_name = queryOptions.last_name;
          }
          if (queryOptions.unsubscribed !== undefined) {
            payload.unsubscribed =
              queryOptions.unsubscribed === true ||
              queryOptions.unsubscribed === 'true';
          }
          result = await this.request(
            apiKey,
            `/audiences/${audienceId}/contacts/${contactId}`,
            'PATCH',
            payload,
          );
          break;
        }

        case 'delete_contact': {
          const audienceId = queryOptions.audience_id;
          const contactId = queryOptions.contact_id;
          if (!audienceId || !contactId) {
            throw new QueryError(
              'Missing parameter',
              'Audience ID and Contact ID are required to delete a contact',
              { missing: { audienceId: !audienceId, contactId: !contactId } },
            );
          }
          result = await this.request(
            apiKey,
            `/audiences/${audienceId}/contacts/${contactId}`,
            'DELETE',
          );
          break;
        }

        case 'create_broadcast': {
          const payload: any = {
            audience_id: queryOptions.audience_id,
            from: queryOptions.from,
            subject: queryOptions.subject,
          };
          if (queryOptions.html) payload.html = queryOptions.html;
          if (queryOptions.name) payload.name = queryOptions.name;

          result = await this.request(apiKey, '/broadcasts', 'POST', payload);
          break;
        }

        case 'send_broadcast': {
          const broadcastId = queryOptions.broadcast_id;
          if (!broadcastId) {
            throw new QueryError(
              'Missing parameter',
              'Broadcast ID is required to send a broadcast',
              { missing: 'broadcast_id' },
            );
          }
          const payload: any = {};
          if (queryOptions.scheduled_at) {
            payload.scheduled_at = queryOptions.scheduled_at;
          }
          result = await this.request(
            apiKey,
            `/broadcasts/${broadcastId}/send`,
            'POST',
            payload,
          );
          break;
        }

        default:
          throw new QueryError(
            'Invalid operation',
            `Unsupported operation: ${operation}`,
            { operation },
          );
      }
    } catch (error: any) {
      if (error instanceof QueryError) {
        throw error;
      }
      throw new QueryError(
        'Query could not be completed',
        error?.message || 'Unknown error occurred',
        error,
      );
    }

    return {
      status: 'ok',
      data: result,
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const { apiKey } = sourceOptions || {};
    if (!apiKey) {
      throw new QueryError(
        'Connection could not be established',
        'API key is missing',
        { missing: 'apiKey' },
      );
    }

    try {
      await this.request(apiKey, '/domains', 'GET');
      return { status: 'ok' };
    } catch (error: any) {
      throw new QueryError(
        'Connection could not be established',
        error?.message || 'Invalid Resend API key or connection failed',
        error,
      );
    }
  }
}
