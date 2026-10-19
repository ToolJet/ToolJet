/** @jest-environment node */
// Release audit round 4 (Codex fixture run-xlsx-range-boundary, rebuilt here): a 5 KB XLSX whose sheet declares the
// range A1:XFD1048576 over 40 cells made the spreadsheet conversion walk all 17 billion cells of that range, and it
// never finished. The File upload now reads a range too large to convert only as far as the cells it has, and a sheet
// whose cells really span more than that is reported in parseError, not converted.
//
// An unbounded conversion cannot be interrupted from inside this process, so every workbook is parsed in a child
// process with its own heap and a deadline; a regression is killed there and fails the test, it does not hang jest.
import { spawn } from 'child_process';
import path from 'path';
import JSZip from 'jszip';
// eslint-disable-next-line import/no-unresolved
import * as XLSX from 'xlsx';

const frontend = path.resolve(__dirname, '../../../../..');
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DEADLINE_MS = 10000;
jest.setTimeout(DEADLINE_MS + 10000);

// Bundles the UI 2.0 parser and the native one (esbuild, packages left to node), parses the workbook with both, and
// prints what each gave. The native reader is run only for workbooks it can finish.
const WORKER = `
const path = require('path');
const { createRequire } = require('module');
const frontend = process.argv[1];
const req = createRequire(path.join(frontend, 'package.json'));
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', async () => {
  const { base64, type, native } = JSON.parse(input);
  const out = req('esbuild').buildSync({
    stdin: {
      contents: "export * as ui2 from '@/AppBuilder/Widgets/Ui2/FileUpload/fileParse'; export * as fp from '@/AppBuilder/Widgets/FilePicker/helpers/fileProcessing';",
      resolveDir: path.join(frontend, 'src'),
      loader: 'ts',
    },
    tsconfig: path.join(frontend, 'tsconfig.json'),
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', logLevel: 'silent',
    // import('xlsx') as require: an external import() would resolve from wherever this script is run.
    supported: { 'dynamic-import': false },
  });
  const m = { exports: {} };
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(m, m.exports, req);
  const { ui2, fp } = m.exports;
  const file = new File([Buffer.from(base64, 'base64')], 'book.xlsx', { type });
  const parsed = await ui2.parseContent(file, '', base64, { parseFileType: 'auto-detect' });
  const nativeData = native ? await fp.processXls(base64) : undefined;
  process.stdout.write(JSON.stringify({ parsed, nativeData }));
});
`;

const parseInChild = (bytes, { native = false } = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--max-old-space-size=256', '-e', WORKER, frontend], {
      cwd: frontend,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let killed = false;
    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
    }, DEADLINE_MS);
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr = (stderr + chunk).slice(-4000)));
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return reject(new Error(`parsing did not finish within ${DEADLINE_MS} ms`));
      if (code !== 0) return reject(new Error(`parser process exited ${code}: ${stderr}`));
      resolve(JSON.parse(stdout));
    });
    child.stdin.end(JSON.stringify({ base64: Buffer.from(bytes).toString('base64'), type: XLSX_TYPE, native }));
  });

const ROWS = [
  ['code', 'name', 'qty', 'active'],
  ['0012', 'Bolt', 4, true],
  ['0013', 'Nut', 0, false],
  ['0014', 'Washer', 12, true],
];
const EXPECTED = [
  { code: '0012', name: 'Bolt', qty: 4, active: true },
  { code: '0013', name: 'Nut', qty: 0, active: false },
  { code: '0014', name: 'Washer', qty: 12, active: true },
];
const SHEET = 'xl/worksheets/sheet1.xml';
let original;
let sheetXml;
beforeAll(async () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ROWS), 'Sheet1');
  original = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  sheetXml = await (await JSZip.loadAsync(original)).file(SHEET).async('string');
  expect(sheetXml).toContain('<dimension ref="A1:D4"/>');
});
// The same workbook with only its sheet XML changed: a declared range, and optionally cells added to it.
const variant = async (ref, extraRows = '') => {
  const zip = await JSZip.loadAsync(original);
  const xml = sheetXml
    .replace('<dimension ref="A1:D4"/>', `<dimension ref="${ref}"/>`)
    .replace('</sheetData>', `${extraRows}</sheetData>`);
  zip.file(SHEET, xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
};

test('a workbook declaring its own extent reads its rows, as the native reader does', async () => {
  const { parsed, nativeData } = await parseInChild(original, { native: true });
  expect(parsed).toEqual({ data: { Sheet1: EXPECTED }, error: '' });
  expect(parsed.data).toEqual(nativeData);
});

test('a declared range wider than the cells, within the budget, reads exactly as the native reader does', async () => {
  const { parsed, nativeData } = await parseInChild(await variant('A1:Z1000'), { native: true });
  expect(parsed.error).toBe('');
  expect(parsed.data.Sheet1).toHaveLength(3);
  expect(parsed.data.Sheet1[0]).toMatchObject(EXPECTED[0]);
  expect(parsed.data).toEqual(nativeData);
});

test('a sheet declaring A1:XFD1048576 over 16 cells is read as far as its cells go', async () => {
  const { parsed } = await parseInChild(await variant('A1:XFD1048576'));
  expect(parsed).toEqual({ data: { Sheet1: EXPECTED }, error: '' });
});

test('a sheet whose cells really span the whole grid is not converted, and parseError says why', async () => {
  const far = '<row r="1048576"><c r="XFD1048576" t="str"><v>end</v></c></row>';
  const { parsed } = await parseInChild(await variant('A1:XFD1048576', far));
  expect(parsed.data).toBeNull();
  expect(parsed.error).toBe(
    'book.xlsx: the first sheet is too large to read (1048576 rows by 16384 columns; the limit is 2000000 cells)'
  );
});
