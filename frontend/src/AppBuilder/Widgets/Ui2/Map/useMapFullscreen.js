import { useEffect, useState } from 'react';

/** Full screen: the browser's when it allows it, else the map fills the window. Escape, or leaving the browser's full
 *  screen, ends it. */
export const useMapFullscreen = ({ frameRef, mapRef, resize }) => {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const map = mapRef.current;
    if (map) setTimeout(() => mapRef.current && resize(mapRef.current), 0);
    if (!expanded) return undefined;
    const onKey = (e) => e.key === 'Escape' && setExpanded(false);
    const onChange = () => !document.fullscreenElement && setExpanded(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onChange);
    };
  }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (expanded) {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setExpanded(false);
      return;
    }
    setExpanded(true);
    frame?.requestFullscreen?.().catch(() => {});
  };

  return { expanded, toggleFullscreen };
};
