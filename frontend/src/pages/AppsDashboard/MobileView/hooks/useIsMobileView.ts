import { useEffect, useState } from 'react';

// Just below the 720px tablet breakpoint.
const MOBILE_QUERY = '(max-width: 719.98px)';

export function useIsMobileView(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (event: { matches: boolean }) => setIsMobile(event.matches);

    // The viewport may have crossed the breakpoint between the initial render and this effect.
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
