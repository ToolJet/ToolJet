import { useEffect, useMemo, useRef, useState } from 'react';
import moment from 'moment';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { authenticationService } from '@/_services';
import { fetchMenuApps } from './menuAppsRequest';
import { ALL_APPS_TYPE, evaluateAllAppsHidden, expandAllAppsNavItems } from './allAppsNavItems';

const isSignedIn = () => !!authenticationService.currentSessionValue?.current_user?.id;

/**
 * The page menu's items, with every "All apps" item expanded into links to the released
 * apps the viewer can open. Anonymous viewers of a public app get no links: there is no
 * user to check access for.
 */
export const useMenuPages = (moduleId = 'canvas') => {
  const pages = useStore((state) => state.modules.canvas.pages, shallow);
  const hasAllAppsItem = pages.some((page) => page?.type === ALL_APPS_TYPE);
  const currentAppId = useStore((state) => state.appStore.modules[moduleId]?.app?.appId);
  const currentMode = useStore((state) => state.modeStore.modules[moduleId]?.currentMode);
  const exposedValues = useStore((state) => state.resolvedStore.modules[moduleId]?.exposedValues);
  const componentIds = useStore((state) => state.modules[moduleId]?.componentNameIdMapping);
  const queryIds = useStore((state) => state.modules[moduleId]?.queryNameIdMapping);
  const [menuApps, setMenuApps] = useState([]);
  const loggedErrors = useRef(new Set());

  useEffect(() => {
    if (!hasAllAppsItem || !isSignedIn()) return;
    let cancelled = false;
    fetchMenuApps(currentAppId).then((apps) => {
      if (!cancelled) setMenuApps(apps);
    });
    return () => {
      cancelled = true;
    };
  }, [hasAllAppsItem, currentAppId]);

  return useMemo(() => {
    if (!hasAllAppsItem) return pages;

    const errors = [];
    const isHidden = (item, appContext) => {
      const { hidden, error } = evaluateAllAppsHidden(item.hidden, appContext, {
        exposedValues,
        componentIds,
        queryIds,
      });
      if (error) errors.push({ item, error });
      return hidden;
    };

    const expanded = expandAllAppsNavItems(pages, menuApps, { currentAppId, isHidden });

    if (currentMode !== 'view') {
      for (const { item, error } of errors) {
        const key = `${item.id}:${item.hidden?.value}:${error?.message}`;
        if (loggedErrors.current.has(key)) continue;
        loggedErrors.current.add(key);
        useStore.getState().debugger?.log?.({
          logLevel: 'error',
          type: 'navigation',
          kind: 'page-nav',
          key: `[Page ${item.name.replace(/ /g, '_')}]`,
          errorTarget: 'Pages',
          error: {
            message: `Hide expression failed, so the affected apps are hidden: ${error?.message ?? error}`,
            description: JSON.stringify(String(error?.message ?? error), null, 2),
          },
          strace: 'app_level',
          timestamp: moment().toISOString(),
        });
      }
    }

    return expanded;
  }, [hasAllAppsItem, pages, menuApps, currentAppId, currentMode, exposedValues, componentIds, queryIds]);
};
