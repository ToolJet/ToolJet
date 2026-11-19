import { decodePromptCookie } from '../utils';

describe('decodePromptCookie', () => {
  it('keeps text with a literal % instead of throwing', () => {
    expect(decodePromptCookie('build a crm for 100% of leads')).toBe('build a crm for 100% of leads');
  });

  it('decodes a URL-encoded prompt from an older website flow', () => {
    expect(decodePromptCookie('build%20a%20crm')).toBe('build a crm');
  });

  it('passes plain text through unchanged', () => {
    expect(decodePromptCookie('build a crm')).toBe('build a crm');
  });
});
