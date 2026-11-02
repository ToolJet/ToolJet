import { expect } from 'chai';
import FormData = require('form-data');
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Writable } from 'stream';

import { buildUploadFormData } from '../../src/lib/library/upload-form';

function writeDist(distDir: string, opts: { css?: boolean } = {}): void {
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(path.join(distDir, 'index.js'), 'console.log(1);');
  fs.writeFileSync(path.join(distDir, 'manifest.json'), '{"components":{}}');
  if (opts.css) fs.writeFileSync(path.join(distDir, 'index.css'), 'body{}');
}

// form-data doesn't expose its field list, so drain the multipart stream in memory
// (no HTTP server, so a stalled socket can't leave the test hanging until timeout).
function collectMultipartFieldNames(form: FormData): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    sink.on('finish', () => {
      const parts = Buffer.concat(chunks).toString('latin1').split(`--${form.getBoundary()}`);
      const names = parts.map((part) => /name="([^"]+)"/.exec(part)?.[1]).filter((name): name is string => !!name);
      resolve(names);
    });
    form.on('error', reject);
    form.pipe(sink);
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
