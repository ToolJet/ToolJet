import fetch = require('node-fetch');

import { uploadToEndpoint } from './uploader';

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiToken: string,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method,
      headers: {
        Authorization:  `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${method} ${path} → ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // POST /api/custom-component-libraries
  async createLibrary(name: string): Promise<{ id: string; name: string }> {
    return this.request('POST', '/custom-component-libraries', { name });
  }

  // GET /api/custom-component-libraries/:id
  async verifyLibrary(id: string): Promise<void> {
    await this.request('GET', `/custom-component-libraries/${id}`);
  }

  // POST /api/custom-component-libraries/:id/dev (multipart — handled by uploader.ts)
  async uploadDev(libraryId: string, distDir: string): Promise<{ devUploadedAt: string }> {
    return uploadToEndpoint(
      `${this.baseUrl}/api/custom-component-libraries/${libraryId}/dev`,
      this.apiToken,
      distDir,
    ) as Promise<{ devUploadedAt: string }>;
  }

  // POST /api/custom-component-libraries/:id/revisions (multipart)
  async publishRevision(libraryId: string, distDir: string, message?: string) {
    return uploadToEndpoint(
      `${this.baseUrl}/api/custom-component-libraries/${libraryId}/revisions`,
      this.apiToken,
      distDir,
      message ? { message } : {},
    );
  }

  // GET /api/profile — for login verification
  async fetchProfile(): Promise<{ email: string }> {
    return this.request('GET', '/profile');
  }
}