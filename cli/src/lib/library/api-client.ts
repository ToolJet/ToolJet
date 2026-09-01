import fetch = require('node-fetch');
import FormData = require('form-data');

import { buildUploadFormData } from './upload-form';
import { parseApiErrorMessage } from '../api-error';

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string, private readonly apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async handleResponse<T>(res: import('node-fetch').Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text();
      throw new Error(parseApiErrorMessage(res.status, text));
    }

    return res.json() as Promise<T>;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(res);
  }

  // Attaching the 'error' listener before starting the fetch is what matters here — a stream
  // failure while reading a file (deleted mid-upload, permission error) surfaces as a rejected
  // promise instead of an unhandled 'error' event that would crash the process.
  private sendForm<T>(method: string, path: string, form: FormData): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      form.once('error', (err: unknown) => reject(err instanceof Error ? err : new Error(String(err))));

      fetch(`${this.baseUrl}/api${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.apiToken}`, ...form.getHeaders() },
        body: form,
      })
        .then((res) => this.handleResponse<T>(res))
        .then(resolve, reject);
    });
  }

  // POST /api/custom-component-libraries
  async createLibrary(name: string): Promise<{ id: string; name: string; correlationId: string }> {
    return this.request('POST', '/custom-component-libraries', { name });
  }

  // GET /api/custom-component-libraries/:id
  async verifyLibrary(id: string): Promise<void> {
    await this.request('GET', `/custom-component-libraries/${id}`);
  }

  // POST /api/custom-component-libraries/find-or-create
  async findOrCreateLibrary(
    correlationId: string,
    name: string
  ): Promise<{ id: string; name: string; correlationId: string; created: boolean; organizationId: string }> {
    return this.request('POST', '/custom-component-libraries/find-or-create', { correlationId, name });
  }

  // POST /api/custom-component-libraries/:id/dev (multipart)
  async uploadDev(libraryId: string, distDir: string): Promise<{ devUploadedAt: string }> {
    const form = buildUploadFormData(distDir);
    return this.sendForm('POST', `/custom-component-libraries/${libraryId}/dev`, form);
  }

  // POST /api/custom-component-libraries/:id/revisions (multipart)
  async publishRevision(
    libraryId: string,
    distDir: string,
    message?: string
  ): Promise<{ id: string; version: string; bundleUrl: string }> {
    const form = buildUploadFormData(distDir, message ? { message } : {});
    return this.sendForm('POST', `/custom-component-libraries/${libraryId}/revisions`, form);
  }

  async login(): Promise<{ email: string; organizationId: string }> {
    return this.request('GET', '/personal-access-tokens/validate');
  }
}
