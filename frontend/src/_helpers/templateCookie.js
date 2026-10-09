import { aiOnboardingService } from '@/_services/ai-onboarding.service';

// The website (a different site) cannot set cookies for this app, so it passes the template id
// in the URL: ?tj_template_id=... on a direct redirect, or inside the OAuth state on SSO.
// Set it as a first-party cookie before any route mounts, so the session payload carries it
// through login and HomePage deploys the template.
const TEMPLATE_ID_PARAM = 'tj_template_id';
export const SET_COOKIE_TIMEOUT_MS = 5000;

const readTemplateIdFromUrl = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.substring(1));
  const state = hash.get('state') || query.get('state');
  return query.get(TEMPLATE_ID_PARAM) || (state && new URLSearchParams(state).get(TEMPLATE_ID_PARAM));
};

export const persistTemplateIdFromUrl = async () => {
  const templateId = readTemplateIdFromUrl();
  if (!templateId || !/^[a-z0-9-]{1,100}$/.test(templateId)) return;

  // timeout: a hung call must not hold the first render
  let timer;
  try {
    await Promise.race([
      aiOnboardingService.setAiCookie({ [TEMPLATE_ID_PARAM]: templateId }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('set-ai-cookie timed out')), SET_COOKIE_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    // Keep the param in the URL: the id is the only copy, and a reload retries
    console.error('Failed to set template cookie:', error);
    return;
  } finally {
    clearTimeout(timer);
  }

  // Drop the param so a reload does not deploy the template a second time
  const url = new URL(window.location.href);
  if (url.searchParams.has(TEMPLATE_ID_PARAM)) {
    url.searchParams.delete(TEMPLATE_ID_PARAM);
    window.history.replaceState(window.history.state, '', url);
  }
};
