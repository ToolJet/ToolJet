import { expect } from 'chai';
import * as fs from 'fs';
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';

import { buildUploadFormData } from '../../src/lib/library/upload-form';

function writeDist(distDir: string, opts: { css?: boolean } = {}): void {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.js'), 'console.log(1);');
  fs.writeFileSync(path.join(distDir, 'manifest.json'), '{"components":{}}');
  if (opts.css) fs.writeFileSync(path.join(distDir, 'index.css'), 'body{}');
}

// Submits the built FormData to a throwaway local HTTP server and inspects the
// multipart fields it actually receives — form-data doesn't expose its field
// list for direct inspection, so posting it is the most reliable way to assert
// what's on the wire.
function collectMultipartFieldNames(form: import('form-data')): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const busboyLike: string[] = [];
      let body = Buffer.alloc(0);
      req.on('data', (chunk) => (body = Buffer.concat([body, chunk])));
      req.on('end', () => {
        const boundaryMatch = /boundary=(.+)$/.exec(req.headers['content-type'] || '');
        const boundary = boundaryMatch ? boundaryMatch[1] : '';
        const parts = body.toString('latin1').split(`--${boundary}`);
        for (const part of parts) {
          const nameMatch = /name="([^"]+)"/.exec(part);
          if (nameMatch) busboyLike.push(nameMatch[1]);
        }
        res.end('ok');
        server.close();
        resolve(busboyLike);
      });
    });

    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      form.submit(`http://127.0.0.1:${port}/`, (err) => {
        if (err) reject(err);
      });
    });
  });
}

describe('buildUploadFormData', () => {
  let distDir: string;

  beforeEach(() => {
    distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tooljet-cli-dist-'));
  });

  afterEach(() => fs.rmSync(distDir, { recursive: true, force: true }));

  it('throws when the JS bundle is missing', () => {
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'manifest.json'), '{}');

    expect(() => buildUploadFormData(distDir)).to.throw(/Unable to find JS bundle/);
  });

  it('throws when the manifest is missing', () => {
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.js'), 'x');

    expect(() => buildUploadFormData(distDir)).to.throw(/Unable to find manifest/);
  });

  it('includes bundle and manifest fields, and no css field when index.css is absent', async () => {
    writeDist(distDir);

    const fields = await collectMultipartFieldNames(buildUploadFormData(distDir));

    expect(fields).to.include.members(['bundle', 'manifest']);
    expect(fields).to.not.include('css');
  });

  it('includes the css field when index.css is present', async () => {
    writeDist(distDir, { css: true });

    const fields = await collectMultipartFieldNames(buildUploadFormData(distDir));

    expect(fields).to.include.members(['bundle', 'manifest', 'css']);
  });

  it('includes extra fields (e.g. version, message) alongside the files', async () => {
    writeDist(distDir);

    const fields = await collectMultipartFieldNames(
      buildUploadFormData(distDir, { version: '1.0.0', message: 'Initial release' })
    );

    expect(fields).to.include.members(['bundle', 'manifest', 'version', 'message']);
  });
});
