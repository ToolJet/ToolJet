/** @jest-environment node */

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmdirSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import generateFile from '../generate-file';

describe('generateFile PDF export', () => {
  let directory;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'tooljet-generate-file-'));
  });

  afterEach(() => {
    for (const filename of readdirSync(directory)) unlinkSync(join(directory, filename));
    rmdirSync(directory);
  });

  // Use the installed PDF libraries and their Node filesystem adapter: assertions
  // inspect the downloaded PDF, rather than replacing table rendering with a mock.
  test.each([
    ['empty array', [], []],
    ['rows', [{ name: 'Alice', count: 7 }], ['name', 'count', 'Alice', '7']],
    ['object', { city: 'Mumbai', active: true }, ['city', 'active', 'Mumbai', 'true']],
    ['text', 'ToolJet PDF export', ['ToolJet PDF export']],
  ])('saves a complete PDF for %s', async (_label, data, contents) => {
    const filename = join(directory, 'export.pdf');

    await generateFile(filename, data, 'pdf');

    const pdf = readFileSync(filename, 'latin1');
    expect(pdf).toMatch(/^%PDF-/);
    expect(pdf).toContain('%%EOF');
    for (const content of contents) expect(pdf).toContain(content);
  });

  test('rejects unsupported data without saving a file', async () => {
    const filename = join(directory, 'invalid.pdf');

    await expect(generateFile(filename, 42, 'pdf')).rejects.toThrow('Invalid data type');
    expect(existsSync(filename)).toBe(false);
  });
});
