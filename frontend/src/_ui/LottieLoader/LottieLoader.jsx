import React, { useEffect, useRef } from 'react';

/**
 * Full page loading animation, identical to the pre-boot loader in index.ejs.
 *
 * The lottie player and the animation JSON are static assets pulled in by index.ejs
 * before the app bundle, so this reuses `window.lottie` and the `.tj-app-loader` styles
 * already in the document rather than bundling a second copy of either.
 *
 * Kept dependency free (React only) so it is safe to import from RootRouter/ViewerApp
 * without leaking anything into the isolated viewer bundle.
 */
export const LottieLoader = () => {
  const containerRef = useRef(null);
  const darkModeEnabled = localStorage.getItem('darkMode') === 'true';

  useEffect(() => {
    if (!window.lottie || !containerRef.current) return;

    const animation = window.lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: `assets/lottie/app-loader-${darkModeEnabled ? 'dark' : 'light'}.json`,
    });

    return () => animation.destroy();
  }, [darkModeEnabled]);

  return (
    <div className={`tj-app-loader${darkModeEnabled ? ' dark-loader' : ''}`}>
      <div className="loader-animation" ref={containerRef} />
    </div>
  );
};
