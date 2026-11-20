import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TooltipProvider } from '@/components/ui/Rocket/Tooltip/Tooltip';

const AppBuilderTooltipContext = createContext(null);

export const AppBuilderTooltipProvider = ({ children }) => {
  const [isWarm, setIsWarm] = useState(false);
  const warmTimer = useRef();

  const markTooltipClosed = useCallback(() => {
    window.clearTimeout(warmTimer.current);
    setIsWarm(true);
    warmTimer.current = window.setTimeout(() => setIsWarm(false), 900);
  }, []);

  useEffect(() => () => window.clearTimeout(warmTimer.current), []);

  const value = useMemo(() => ({ delayDuration: isWarm ? 80 : 450, markTooltipClosed }), [isWarm, markTooltipClosed]);

  return (
    <AppBuilderTooltipContext.Provider value={value}>
      <TooltipProvider delayDuration={450} skipDelayDuration={0} disableHoverableContent={false}>
        {children}
      </TooltipProvider>
    </AppBuilderTooltipContext.Provider>
  );
};

export const useAppBuilderTooltip = () => useContext(AppBuilderTooltipContext);

// Widgets and the app's own navigation render a customer's app, so inside them ToolTip shows the same
// tooltip the Viewer does, marked so the editor chrome's variables stop at it.
const WIDGET_SCOPE = { widget: true };
export const WidgetTooltipScope = ({ children }) => (
  <AppBuilderTooltipContext.Provider value={WIDGET_SCOPE}>{children}</AppBuilderTooltipContext.Provider>
);
