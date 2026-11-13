import { persistTemplateIdFromUrl, SET_COOKIE_TIMEOUT_MS } from '../templateCookie';
import { aiOnboardingService } from '@/_services/ai-onboarding.service';

const visit = (url) => window.history.replaceState(null, '', url);

describe('persistTemplateIdFromUrl', () => {
  let setAiCookie;

  beforeEach(() => {
    setAiCookie = jest.spyOn(aiOnboardingService, 'setAiCookie').mockResolvedValue({});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    visit('/');
  });

  it('sets the cookie from the query string and drops the param so a reload does not deploy twice', async () => {
    visit('/?tj_template_id=expense-reimbursement&utm=x');
    await persistTemplateIdFromUrl();

    expect(setAiCookie).toHaveBeenCalledWith({ tj_template_id: 'expense-reimbursement' }, expect.any(AbortSignal));
    expect(window.location.search).toBe('?utm=x');
  });

  it('reads the template id from the OAuth state on an SSO return', async () => {
    visit('/#state=tj_template_id%3Dexpense-reimbursement%26redirectTo%3D%2F');
    await persistTemplateIdFromUrl();

    expect(setAiCookie).toHaveBeenCalledWith({ tj_template_id: 'expense-reimbursement' }, expect.any(AbortSignal));
  });

  it('ignores an id with characters outside a template slug', async () => {
    visit('/?tj_template_id=../../etc');
    await persistTemplateIdFromUrl();

    expect(setAiCookie).not.toHaveBeenCalled();
  });

  it('does nothing when the URL carries no template id', async () => {
    visit('/?foo=bar');
    await persistTemplateIdFromUrl();

    expect(setAiCookie).not.toHaveBeenCalled();
  });

  it('keeps the param when the cookie call fails, so a reload retries', async () => {
    setAiCookie.mockRejectedValue(new Error('network'));
    visit('/?tj_template_id=expense-reimbursement');
    await persistTemplateIdFromUrl();

    expect(window.location.search).toBe('?tj_template_id=expense-reimbursement');
  });

  it('gives the call a timeout and keeps the param when it aborts', async () => {
    const timeout = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
    setAiCookie.mockImplementation((_, signal) => (signal.aborted ? Promise.reject(signal.reason) : Promise.resolve()));
    visit('/?tj_template_id=expense-reimbursement');
    await persistTemplateIdFromUrl();

    expect(timeout).toHaveBeenCalledWith(SET_COOKIE_TIMEOUT_MS);
    expect(window.location.search).toBe('?tj_template_id=expense-reimbursement');
  });
});
