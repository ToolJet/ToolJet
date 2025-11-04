import React from 'react';
import { AppsPageContainer } from '@/features/apps/containers/AppsPageContainer';

export default {
  title: 'Flows/AppsPage/Page (Container)',
  component: AppsPageContainer,
  parameters: { layout: 'fullscreen' },
};

export const FromStaticHook = () => <AppsPageContainer />;

export const AppsFirstTimeEmpty = () => <AppsPageContainer />;
AppsFirstTimeEmpty.parameters = {
  msw: {
    handlers: [
      // placeholder: return empty list for apps if/when API is added
    ],
  },
};

// MSW handlers can be added here in the future to mock API responses.
// FromStaticHook.parameters = { msw: { handlers: [rest.get('/api/apps', ...)] } };


