import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/fileModel';

describe('pickers model: files', () => {
  it('formats sizes', () => {
    expect(M.formatBytes(0)).toBe('0 B');
    expect(M.formatBytes(512)).toBe('512 B');
    expect(M.formatBytes(1536)).toBe('1.5 KB');
    expect(M.formatBytes(5242880)).toBe('5 MB');
    expect(M.formatBytes('junk')).toBe('0 B');
  });

  it('turns accept lists into react-dropzone maps and words', () => {
    expect(M.toDropzoneAccept('')).toBeUndefined();
    expect(M.toDropzoneAccept(12)).toBeUndefined();
    expect(M.toDropzoneAccept('image/*, .pdf, .weird, nonsense')).toEqual({
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/octet-stream': ['.weird'],
    });
    expect(M.acceptHint(['image/*', 'application/pdf', '.csv', 'text/csv'])).toBe('Images, PDF, CSV');
    expect(M.acceptHint(undefined)).toBe('');
  });

  it('knows file kinds and limits', () => {
    expect(M.fileKind('image/png', 'a.png')).toBe('image');
    expect(M.fileKind('', 'report.PDF')).toBe('pdf');
    expect(M.fileKind('text/csv', 'a.csv')).toBe('sheet');
    expect(M.fileKind('application/zip', 'a.zip')).toBe('archive');
    expect(M.fileKind(undefined, undefined)).toBe('other');
    expect(M.clampFiles('x')).toBe(10);
    expect(M.clampFiles(1000)).toBe(100);
    expect(M.clampBytes(-5)).toBe(0);
  });

  it('names the first rejection', () => {
    const big = [{ file: { name: 'big.png' }, errors: [{ code: 'file-too-large' }] }];
    expect(M.rejectionMessage(big, { maxSize: 1048576 })).toBe('"big.png" is larger than 1 MB');
    expect(M.rejectionMessage([{ file: { name: 'a.txt' }, errors: [{ code: 'file-invalid-type' }] }])).toBe(
      '"a.txt" is not an accepted file type'
    );
    expect(M.rejectionMessage([{ errors: [{ code: 'too-many-files' }] }], { maxFiles: 3 })).toBe(
      'You can upload up to 3 files'
    );
    expect(M.rejectionMessage(null)).toBe('');
  });
});
