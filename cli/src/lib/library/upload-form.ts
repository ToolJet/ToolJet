import * as fs from 'fs';
import * as path from 'path';
import FormData = require('form-data');

export function buildUploadFormData(distDir: string, extraFields: Record<string, string> = {}): FormData {
  const bundlePath = path.join(distDir, 'index.js');
  const manifestPath = path.join(distDir, 'manifest.json');
  const cssPath = path.join(distDir, 'index.css');

  if (!fs.existsSync(bundlePath)) {
    throw new Error(`Unable to find JS bundle at ${bundlePath}`);
  }

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Unable to find manifest at ${manifestPath}`);
  }

  const form = new FormData();

  // Append index.js as 'bundle'
  form.append('bundle', fs.createReadStream(bundlePath), {
    filename: 'index.js',
    contentType: 'application/javascript',
  });

  // Append manifest.json
  form.append('manifest', fs.createReadStream(manifestPath), {
    filename: 'manifest.json',
    contentType: 'application/json',
  });

  // Append index.css as 'css' if present
  if (fs.existsSync(cssPath)) {
    form.append('css', fs.createReadStream(cssPath), {
      filename: 'index.css',
      contentType: 'text/css',
    });
  }

  // Append optional extra fields (e.g., message for deploy)
  for (const [key, value] of Object.entries(extraFields)) {
    form.append(key, value);
  }

  return form;
}
