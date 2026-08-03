import * as fs from 'fs';
import * as path from 'path';
import FormData = require('form-data');
import fetch = require('node-fetch');

export interface UploadResult {
  bundleUrl: string;
  cssUrl?: string;
  devUploadedAt: string;
}

// Creates a ZIP of dist/ and POSTs as multipart
export async function uploadToEndpoint(
  endpoint: string,     // full URL
  apiToken: string,
  distDir:  string,
  extraFields: Record<string, string> = {}
): Promise<unknown> {
  const form = new FormData();

  // Append index.js as 'bundle'
  form.append('bundle', fs.createReadStream(path.join(distDir, 'index.js')), {
    filename:    'index.js',
    contentType: 'application/javascript',
  });

  // Append index.css as 'css' if present
  const cssPath = path.join(distDir, 'index.css');
  if (fs.existsSync(cssPath)) {
    form.append('css', fs.createReadStream(cssPath), {
      filename:    'index.css',
      contentType: 'text/css',
    });
  }

  // Append manifest.json
  form.append('manifest', fs.createReadStream(path.join(distDir, 'manifest.json')), {
    filename:    'manifest.json',
    contentType: 'application/json',
  });

  // Append optional extra fields (e.g., message for deploy)
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiToken}`, ...form.getHeaders() },
    body:    form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Upload failed (${response.status}): ${body}`);
  }

  return response.json();
}