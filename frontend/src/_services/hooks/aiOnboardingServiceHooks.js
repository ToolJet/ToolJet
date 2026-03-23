import { useMutation } from '@tanstack/react-query';

import { updateCurrentSession } from '@/_helpers/authorizeWorkspace';

import { aiOnboardingService } from '../ai-onboarding.service';

export function useDeleteAiCookies() {
  return useMutation({
    mutationFn: () => aiOnboardingService.deleteAiCookies(),
    onSettled: () => {
      updateCurrentSession({
        ai_cookies: {
          tj_api_source: null,
          tj_template_id: null,
        },
      });
    },
  });
}
