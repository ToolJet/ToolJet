import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-marketplace/common';
import { SourceOptions, QueryOptions, Operation } from './types';
import { isValidCpf, isValidCnpj, normalizeCpf, normalizeCnpj } from './validators';

const API_BASE_URL = 'https://api.cpfcnpj.com.br';
const REQUEST_TIMEOUT_MS = 60000;
const GENERIC_ERROR = 'Query could not be completed';

const PACKAGE_BY_OPERATION: Record<string, string> = {
  [Operation.CpfBasic]: '1',
  [Operation.CpfFull]: '3',
  [Operation.CnpjBasic]: '5',
  [Operation.CnpjFull]: '6',
};

const CPF_OPERATIONS: Operation[] = [Operation.CpfBasic, Operation.CpfFull];
const BALANCE_PACKAGES = ['1', '3', '5', '6'];

type ApiResponse = { httpStatus: number; body: any };

export default class CpfCnpj implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions): Promise<QueryResult> {
    const token = (sourceOptions?.token ?? '').trim();
    const operation = queryOptions?.operation as Operation;

    if (!token) {
      throw new QueryError(GENERIC_ERROR, 'API token is required', { code: 'missing_token' });
    }

    switch (operation) {
      case Operation.CpfBasic:
      case Operation.CpfFull:
      case Operation.CnpjBasic:
      case Operation.CnpjFull:
        return this.lookup(token, operation, queryOptions?.document);
      case Operation.Balance:
        return this.balance(token, queryOptions?.package);
      default:
        throw new QueryError(GENERIC_ERROR, `Unsupported operation: ${operation}`, { code: 'unsupported_operation' });
    }
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const token = (sourceOptions?.token ?? '').trim();
    if (!token) {
      return { status: 'failed', message: 'API token is required for connection testing.' };
    }

    try {
      const { httpStatus, body } = await this.request(`${API_BASE_URL}/${token}/saldo/1`, token);
      if (this.isSuccess(httpStatus, body)) {
        return { status: 'ok' };
      }
      // The balance endpoint answers HTTP 401 with an empty body when the token is
      // unknown or not authorized for the outbound IP address of this server.
      const message =
        (body && (body.erro || body.message)) ||
        `Could not validate the API token (HTTP ${httpStatus}). Check the token and make sure the outbound IP address of this ToolJet server is authorized for it.`;
      return { status: 'failed', message };
    } catch (err: any) {
      return { status: 'failed', message: err?.description || err?.message || 'Connection failed' };
    }
  }

  // Look up a CPF or CNPJ. The document is normalized and its check digit is verified
  // before any request is made, so an invalid document never spends a credit.
  private async lookup(token: string, operation: Operation, document?: string): Promise<QueryResult> {
    const isCpf = CPF_OPERATIONS.includes(operation);
    const normalized = isCpf ? normalizeCpf(document ?? '') : normalizeCnpj(document ?? '');
    const valid = isCpf ? isValidCpf(normalized) : isValidCnpj(normalized);

    if (!valid) {
      throw new QueryError(GENERIC_ERROR, isCpf ? 'Invalid CPF check digits' : 'Invalid CNPJ check digits', {
        code: 'invalid_document',
      });
    }

    const packageId = PACKAGE_BY_OPERATION[operation];
    const { httpStatus, body } = await this.request(`${API_BASE_URL}/${token}/${packageId}/${normalized}`, token);
    return this.mapResponse(httpStatus, body);
  }

  // Query the free balance endpoint for the selected package.
  private async balance(token: string, packageId?: string): Promise<QueryResult> {
    const selected = (packageId ?? '').trim();
    if (!BALANCE_PACKAGES.includes(selected)) {
      throw new QueryError(GENERIC_ERROR, 'Select a package to check the balance', { code: 'invalid_package' });
    }

    const { httpStatus, body } = await this.request(`${API_BASE_URL}/${token}/saldo/${selected}`, token);
    return this.mapResponse(httpStatus, body);
  }

  // Issue the GET request with an AbortController timeout and parse the JSON body.
  // The token is redacted from any network error message so it never leaks.
  private async request(url: string, token: string): Promise<ApiResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      // Read the raw text first: some error answers (an unknown token, for example)
      // may come with an empty body, which is not valid JSON but still carries the status.
      const text = await response.text();
      let body: any = null;
      if (text.trim() !== '') {
        try {
          body = JSON.parse(text);
        } catch {
          throw new QueryError(GENERIC_ERROR, 'The API response was not valid JSON', {
            httpStatus: response.status,
          });
        }
      }

      return { httpStatus: response.status, body };
    } catch (err: any) {
      if (err instanceof QueryError) throw err;
      if (err?.name === 'AbortError') {
        throw new QueryError(GENERIC_ERROR, `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds`, {
          code: 'timeout',
        });
      }
      const message = String(err?.message || 'Network error')
        .split(token)
        .join('***');
      throw new QueryError(GENERIC_ERROR, message, {});
    } finally {
      clearTimeout(timeout);
    }
  }

  // The API documents status as the number 1 on success; accept the string "1" as well
  // so a paid lookup is never reported as a failure because of the field type.
  private isSuccess(httpStatus: number, body: any): boolean {
    return httpStatus >= 200 && httpStatus < 300 && !!body && typeof body === 'object' && Number(body.status) === 1;
  }

  // Map a parsed response into a QueryResult, handling the two documented error envelopes.
  private mapResponse(httpStatus: number, body: any): QueryResult {
    if (this.isSuccess(httpStatus, body)) {
      return { status: 'ok', data: body };
    }

    if (body && typeof body === 'object') {
      // API envelope: { status: 0, erro, erroCodigo } (may arrive with HTTP 400 or 401).
      // erroCodigo is documented as numeric, but the message is surfaced even when the
      // code is missing or arrives as a string.
      if (Number(body.status) === 0 || body.erro) {
        const code = Number(body.erroCodigo);
        throw new QueryError(GENERIC_ERROR, body.erro || 'Lookup failed', {
          erroCodigo: Number.isFinite(code) ? code : undefined,
          httpStatus,
        });
      }

      // Gateway envelope: { status: 'error', code, message }.
      if (body.status === 'error' || body.message) {
        throw new QueryError(GENERIC_ERROR, body.message || 'Request rejected by the gateway', {
          code: body.code,
          httpStatus,
        });
      }
    }

    throw new QueryError(GENERIC_ERROR, 'Unexpected response from the CPF.CNPJ API', { httpStatus });
  }
}
