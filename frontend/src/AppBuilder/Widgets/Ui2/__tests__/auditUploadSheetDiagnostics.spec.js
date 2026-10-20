import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
// Release audit 016 (Codex fixture current-upload-workbook-worker-016, rebuilt here): with Parse content on, an Excel
// sheet whose header row repeated a name (same, same) came out with the second column renamed same_1, and a header
// named __proto__ came out as __proto___NaN, with an empty parseError; a cell holding a formula error (#DIV/0!) came
// out as a blank with no word either. A binding reading the header as written missed the column, and a failed
// calculation read as an empty field. The data is kept as converted, and parseError names the renamed headers and
// the error cells.
// eslint-disable-next-line import/no-unresolved
import * as XLSX from 'xlsx';
import { parseContent } from '@/AppBuilder/Widgets/Ui2/FileUpload/fileParse';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
// Excel's error codes as SheetJS stores them (cell.v), with the text Excel shows.
const ERRORS = {
  0x00: '#NULL!',
  0x07: '#DIV/0!',
  0x0f: '#VALUE!',
  0x17: '#REF!',
  0x1d: '#NAME?',
  0x24: '#NUM!',
  0x2a: '#N/A',
};

const parseSheet = async (rows, edit = () => {}) => {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  edit(sheet);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Records');
  const base64 = XLSX.write(book, { type: 'base64', bookType: 'xlsx' });
  const file = new File([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], 'records.xlsx', { type: XLSX_TYPE });
  return parseContent(file, '', base64, { parseFileType: 'auto-detect' });
};
const errorCell = (code) => ({ t: 'e', v: code, w: ERRORS[code] });

test('distinct headers and ordinary cells, blanks and zero included, parse with no error (control)', async () => {
  const parsed = await parseSheet([
    ['code', 'amount', 'note'],
    ['0012', 0, ''],
    ['b', -3, 'text'],
  ]);
  expect(parsed).toEqual({
    data: {
      Sheet1: [
        { code: '0012', amount: 0, note: '' },
        { code: 'b', amount: -3, note: 'text' },
      ],
    },
    error: '',
  });
});

test('repeated headers are kept as converted and named in parseError', async () => {
  const parsed = await parseSheet([
    ['id', 'same', 'same', 'same'],
    [1, 'left', 'middle', 'right'],
  ]);
  expect(parsed.data.Sheet1).toEqual([{ id: 1, same: 'left', same_1: 'middle', same_2: 'right' }]);
  expect(parsed.error).toBe('records.xlsx: headers renamed: same to same_1, same to same_2');
});

test('a header the conversion cannot keep as written (__proto__) is named in parseError', async () => {
  const parsed = await parseSheet([
    ['id', '__proto__'],
    [1, 'special'],
  ]);
  expect(Object.keys(parsed.data.Sheet1[0])).toEqual(['id', '__proto___NaN']);
  expect(parsed.error).toBe('records.xlsx: headers renamed: __proto__ to __proto___NaN');
});

test('cells holding Excel errors are named in parseError with the error each shows', async () => {
  const codes = Object.keys(ERRORS).map(Number);
  const parsed = await parseSheet([['name', 'value'], ...codes.map((code) => [`row ${code}`, 1])], (sheet) =>
    codes.forEach((code, i) => {
      sheet[`B${i + 2}`] = errorCell(code);
    })
  );
  expect(parsed.data.Sheet1).toHaveLength(codes.length);
  expect(parsed.error).toBe(
    'records.xlsx: cells holding errors: B2 #NULL!, B3 #DIV/0!, B4 #VALUE!, B5 #REF!, B6 #NAME? (and 2 more)'
  );
});

test('renamed headers and error cells are both reported, headers first', async () => {
  const parsed = await parseSheet(
    [
      ['same', 'same', 'problem'],
      ['a', 'b', 'okay'],
      ['c', 'd', null],
    ],
    (sheet) => {
      sheet.C3 = errorCell(0x07);
    }
  );
  expect(parsed.error).toBe('records.xlsx: headers renamed: same to same_1; cells holding errors: C3 #DIV/0!');
});
