import { readAiCookiesFromUrl, persistAiCookiesFromUrl } from '../aiOnboardingCookies';

const setUrl = (path: string) => window.history.replaceState(null, '', path);

describe('readAiCookiesFromUrl', () => {
  afterEach(() => setUrl('/'));

  it('reads the prompt from the query string', () => {
    setUrl('/?tj_ai_prompt=' + encodeURIComponent('build a crm for 100% of leads'));
    expect(readAiCookiesFromUrl()).toEqual({ tj_ai_prompt: 'build a crm for 100% of leads' });
  });

  it('reads the prompt from the URL hash', () => {
    setUrl('/#tj_ai_prompt=hello%20world');
    expect(readAiCookiesFromUrl()).toEqual({ tj_ai_prompt: 'hello world' });
  });

  it.each([
    ['query', (state: string) => `/?state=${encodeURIComponent(state)}`],
    ['hash', (state: string) => `/#state=${encodeURIComponent(state)}`],
  ])('reads the prompt from the OAuth state in the %s', (_where, build) => {
    setUrl(build('tj_ai_prompt=' + encodeURIComponent('hello world')));
    expect(readAiCookiesFromUrl()).toEqual({ tj_ai_prompt: 'hello world' });
  });

  it('reads the template id from the query and from the OAuth state', () => {
    setUrl('/?tj_template_id=expense-reimbursement');
    expect(readAiCookiesFromUrl()).toEqual({ tj_template_id: 'expense-reimbursement' });

    setUrl('/?state=' + encodeURIComponent('tj_template_id=expense-reimbursement'));
    expect(readAiCookiesFromUrl()).toEqual({ tj_template_id: 'expense-reimbursement' });
  });

  it('returns the prompt and the template id together', () => {
    setUrl('/?tj_ai_prompt=hello&tj_template_id=expense-reimbursement');
    expect(readAiCookiesFromUrl()).toEqual({ tj_ai_prompt: 'hello', tj_template_id: 'expense-reimbursement' });
  });

  it('ignores a template id with an invalid format', () => {
    setUrl('/?tj_template_id=Bad_Value!');
    expect(readAiCookiesFromUrl()).toEqual({});
  });

  it('ignores an empty or whitespace-only prompt', () => {
    setUrl('/?tj_ai_prompt=%20%20');
    expect(readAiCookiesFromUrl()).toEqual({});
  });

  it('ignores a prompt that is too long for a cookie once encoded', () => {
    setUrl('/?tj_ai_prompt=' + 'a'.repeat(3600));
    expect(readAiCookiesFromUrl()).toEqual({});
  });

  it('counts the encoded length, so a short non-ASCII prompt can still be too long', () => {
    // 1300 chars encode to ~7800 bytes
    setUrl('/?tj_ai_prompt=' + encodeURIComponent('é'.repeat(1300)));
    expect(readAiCookiesFromUrl()).toEqual({});
  });

  it('returns nothing when no param is present', () => {
    setUrl('/?foo=bar');
    expect(readAiCookiesFromUrl()).toEqual({});
  });
});

describe('persistAiCookiesFromUrl', () => {
  afterEach(() => setUrl('/'));

  it('sets both cookies in one call and strips the params from the URL', async () => {
    const setAiCookie = jest.fn().mockResolvedValue(undefined);
    setUrl('/dashboard?tj_ai_prompt=hello&tj_template_id=expense-reimbursement&keep=1');

    await persistAiCookiesFromUrl(setAiCookie);

    expect(setAiCookie).toHaveBeenCalledTimes(1);
    expect(setAiCookie).toHaveBeenCalledWith({ tj_ai_prompt: 'hello', tj_template_id: 'expense-reimbursement' });
    expect(window.location.pathname + window.location.search).toBe('/dashboard?keep=1');
  });

  it('does not call the server when nothing valid is in the URL', async () => {
    const setAiCookie = jest.fn();
    setUrl('/?tj_template_id=Bad_Value!');

    await persistAiCookiesFromUrl(setAiCookie);

    expect(setAiCookie).not.toHaveBeenCalled();
  });

  it('leaves a prompt carried in the OAuth state where it is', async () => {
    const setAiCookie = jest.fn().mockResolvedValue(undefined);
    const state = encodeURIComponent('tj_ai_prompt=hello');
    setUrl(`/?state=${state}`);

    await persistAiCookiesFromUrl(setAiCookie);

    expect(setAiCookie).toHaveBeenCalledWith({ tj_ai_prompt: 'hello' });
    expect(window.location.search).toBe(`?state=${state}`);
  });

  it('does not throw when the server rejects, so the app still boots', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const setAiCookie = jest.fn().mockRejectedValue(new Error('boom'));
    setUrl('/?tj_ai_prompt=hello');

    await expect(persistAiCookiesFromUrl(setAiCookie)).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
