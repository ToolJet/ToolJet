// front-end lists only: workflow and module lists share HomePage but cannot create these apps
export const getAiOnboardingAction = ({ aiCookies, canCreateApp, appType }) => {
  if (appType !== 'front-end') return 'none';
  const hasPrompt = !!aiCookies?.tj_ai_prompt;
  const hasTemplate = !!aiCookies?.tj_template_id;
  if (!hasPrompt && !hasTemplate) return 'none';
  if (!canCreateApp) return 'denied';
  return hasPrompt ? 'prompt' : 'template';
};
