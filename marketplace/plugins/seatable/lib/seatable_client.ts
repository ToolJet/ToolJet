import axios, { AxiosInstance } from 'axios';
import {
  SeaTableTokenResponse,
  SeaTableRow,
  SeaTableMetadata,
  ListRowsResult,
  SqlResult,
} from './types';

/**
 * Lightweight SeaTable API client for ToolJet.
 *
 * Auth flow (matches the SeaTable MCP server pattern):
 * 1. Exchange the long-lived API-Token for a short-lived Base-Token
 *    via GET /api/v2.1/dtable/app-access-token/
 * 2. Use the Base-Token for all subsequent data requests against
 *    /api-gateway/api/v2/dtables/{base_uuid}/...
 */
export class SeaTableClient {
  private readonly serverUrl: string;
  private readonly apiToken: string;

  private baseToken?: string;
  private baseUuid?: string;
  private http?: AxiosInstance;
  private tokenExpiresAt = 0;

  constructor(serverUrl: string, apiToken: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
    this.apiToken = apiToken;
  }

  // --- Authentication -------------------------------------------------------

  private async ensureAuthenticated(): Promise<void> {
    if (this.http && Date.now() < this.tokenExpiresAt) return;

    const url = `${this.serverUrl}/api/v2.1/dtable/app-access-token/`;
    const res = await axios.get<SeaTableTokenResponse>(url, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
      timeout: 15000,
    });

    this.baseToken = res.data.access_token;
    this.baseUuid = res.data.dtable_uuid;
    const dtableServer: string = res.data.dtable_server ?? '';

    if (!this.baseToken || !this.baseUuid || !dtableServer) {
      throw new Error('SeaTable token exchange failed – missing access_token, dtable_uuid, or dtable_server');
    }

    // Renew 1 minute before expiry (default token lifetime = 1h)
    this.tokenExpiresAt = Date.now() + 59 * 60 * 1000;

    const baseURL = `${dtableServer.replace(/\/$/, '')}/api/v2/dtables/${this.baseUuid}`;
    this.http = axios.create({
      baseURL,
      timeout: 30000,
      headers: { Authorization: `Bearer ${this.baseToken}` },
    });
  }

  private async request<T>(fn: (http: AxiosInstance) => Promise<T>): Promise<T> {
    await this.ensureAuthenticated();
    return fn(this.http!);
  }

  // --- Metadata -------------------------------------------------------------

  async getMetadata(): Promise<SeaTableMetadata> {
    return this.request(async (http) => {
      const res = await http.get('/metadata/');
      return res.data.metadata ?? res.data;
    });
  }

  // --- Rows -----------------------------------------------------------------

  async listRows(tableName: string, page = 1, pageSize = 100): Promise<ListRowsResult> {
    return this.request(async (http) => {
      const start = (page - 1) * pageSize;
      const res = await http.get('/rows/', {
        params: { table_name: tableName, start, limit: pageSize, convert_keys: true },
      });
      const rows: SeaTableRow[] = res.data.rows ?? [];
      return { rows, has_more: rows.length === pageSize };
    });
  }

  async getRow(tableName: string, rowId: string): Promise<SeaTableRow> {
    return this.request(async (http) => {
      const res = await http.get(`/rows/${rowId}/`, {
        params: { table_name: tableName, convert_keys: true },
      });
      return res.data;
    });
  }

  async createRow(tableName: string, row: Record<string, unknown>): Promise<SeaTableRow> {
    return this.request(async (http) => {
      const res = await http.post('/rows/', {
        table_name: tableName,
        rows: [row],
      });
      return res.data.first_row ?? res.data;
    });
  }

  async updateRow(
    tableName: string,
    rowId: string,
    row: Record<string, unknown>
  ): Promise<{ success: boolean }> {
    return this.request(async (http) => {
      const res = await http.put('/rows/', {
        table_name: tableName,
        updates: [{ row_id: rowId, row }],
      });
      return res.data;
    });
  }

  async deleteRow(tableName: string, rowId: string): Promise<{ success: boolean }> {
    return this.request(async (http) => {
      const res = await http.delete('/rows/', {
        data: { table_name: tableName, row_ids: [rowId] },
      });
      return res.data;
    });
  }

  async querySql(sql: string): Promise<SqlResult> {
    return this.request(async (http) => {
      const res = await http.post('/sql/', { sql, convert_keys: true });
      return {
        metadata: res.data.metadata ?? {},
        results: res.data.results ?? res.data.rows ?? [],
      };
    });
  }
}
