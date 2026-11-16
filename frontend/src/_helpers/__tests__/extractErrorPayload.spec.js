/**
 * extractErrorPayload — the companion to extractErrorMessage. Where extractErrorMessage throws the
 * extra fields away to get a displayable string, this one hands the whole decoded object back so a
 * caller can use the detail the backend took the trouble to send.
 *
 * Bug this guards: FoldersService.deleteFolder already ships the list of branches that still hold
 * the folder's data sources (JSON-encoded into the message, because AllExceptionsFilter drops every
 * field but `message`). The UI parsed that payload and then discarded `branches`, so a user whose
 * folder looked empty on the current branch was told only "Folder with data sources cannot be
 * deleted" — never which branch to go look at.
 */
import { extractErrorPayload } from '../messages';

describe('extractErrorPayload', () => {
  it('returns the decoded payload, branches included', () => {
    const raw = JSON.stringify({
      message: 'Folder with data sources cannot be deleted',
      branches: ['main', 'feature-1'],
    });

    expect(extractErrorPayload(raw)).toEqual({
      message: 'Folder with data sources cannot be deleted',
      branches: ['main', 'feature-1'],
    });
  });

  it('returns null for a plain (non-JSON) error string', () => {
    expect(extractErrorPayload('Could not delete folder')).toBeNull();
  });

  it('returns null for JSON that is not an object, so callers can use ?. without a type check', () => {
    expect(extractErrorPayload('42')).toBeNull();
    expect(extractErrorPayload('"just a quoted string"')).toBeNull();
    expect(extractErrorPayload('null')).toBeNull();
    expect(extractErrorPayload('["main"]')).toBeNull();
  });

  it('passes through undefined/empty input without throwing', () => {
    expect(extractErrorPayload(undefined)).toBeNull();
    expect(extractErrorPayload('')).toBeNull();
  });
});
