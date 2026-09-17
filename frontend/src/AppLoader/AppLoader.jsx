import React, { useEffect, useLayoutEffect } from 'react';
import { withTranslation } from 'react-i18next';
import _ from 'lodash';
import { resetAllStores } from '@/_stores/utils';
import { resetAllStores as resetAppBuilderStore } from '@/AppBuilder/_stores/utils';
import { timerRegistry } from '@/AppBuilder/_helpers/timerRegistry';
import RenderWorkflow from '@/modules/RenderWorkflow';
import RenderAppBuilder from './RenderAppBuilder';

const AppLoader = (props) => {
  const { type: appType } = props;

  useLayoutEffect(() => {
    resetAllStores();
    return () => {
      timerRegistry.clearAll();
      resetAppBuilderStore();
    };
  }, []);

  // Force a hard reload when browser back/forward navigates away from the editor.
  // This ensures stores (git sync state, branch config, etc.) are fully re-initialized
  // on the destination page, matching the behavior apps already exhibit.
  // Use capture phase to fire before React Router's listener can process the navigation.
  useEffect(() => {
    const handlePopState = (e) => {
      // Don't reload for in-app page switches (multi-page navigation within the editor)
      const navState = e.state?.usr;
      if (navState?.isSwitchingPage) return;
      // Prevent React Router from processing this navigation
      e.stopImmediatePropagation();
      // The popstate has already updated window.location — reload to that URL.
      window.location.reload();
    };
    window.addEventListener('popstate', handlePopState, true);
    return () => window.removeEventListener('popstate', handlePopState, true);
  }, []);

  switch (appType) {
    case 'front-end':
      return <RenderAppBuilder appType="front-end" {...props} />;
    case 'workflow':
      return <RenderWorkflow {...props} />;
    case 'module':
      return <RenderAppBuilder appType="module" {...props} />;
  }
};

export default withTranslation()(AppLoader);
