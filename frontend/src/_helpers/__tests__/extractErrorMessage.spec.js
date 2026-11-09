/**
 * extractErrorMessage — unwraps a backend error message that was JSON-encoded to carry extra
 * detail (e.g. { message, branches } from FoldersService.deleteFolder), so the UI shows just the
 * plain message instead of the raw encoded payload.
 *
 * Bug this guards: deleting a data-source folder that still has data sources in it returned
 * `{"message":"Folder with data sources cannot be deleted","branches":["",""]}` as the error
 * string, and the data-source folder delete handler (List/index.jsx) toasted that raw string
 * verbatim instead of extracting just the message.
 */
import { extractErrorMessage } from '../messages';

describe('extractErrorMessage', () => {
  it('unwraps a JSON-encoded message, dropping the extra fields', () => {
    const raw = JSON.stringify({ message: 'Folder with data sources cannot be deleted', branches: ['', ''] });
    expect(extractErrorMessage(raw)).toBe('Folder with data sources cannot be deleted');
  });

  it('unwraps a JSON-encoded message with real branch names too', () => {
    const raw = JSON.stringify({ message: 'Folder with apps cannot be deleted', branches: ['main', 'feature-1'] });
    expect(extractErrorMessage(raw)).toBe('Folder with apps cannot be deleted');
  });

  it('returns a plain (non-JSON) string unchanged', () => {
    expect(extractErrorMessage('Could not delete folder')).toBe('Could not delete folder');
  });

  it('falls back to the raw string when message is missing from otherwise-valid JSON', () => {
    const raw = JSON.stringify({ branches: ['main'] });
    expect(extractErrorMessage(raw)).toBe(raw);
  });

  it('passes through undefined/empty input without throwing', () => {
    expect(extractErrorMessage(undefined)).toBeUndefined();
    expect(extractErrorMessage('')).toBe('');
  });
});
