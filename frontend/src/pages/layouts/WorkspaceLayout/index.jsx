import React from 'react';

import Layout from '@/_ui/Layout';
import useStore from '@/AppBuilder/_stores/store';

import Header from './Header';

const classes = { contentContainer: 'tw-h-dvh tw-grid tw-grid-rows-[auto_1fr_auto]', contentBody: 'tw-pt-0' };

export default function WorkspaceLayout({ children }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const updateIsTJDarkMode = useStore((state) => state.updateIsTJDarkMode);

  const handleSwitchTheme = () => {
    updateIsTJDarkMode(!darkMode);
    localStorage.setItem('darkMode', !darkMode);
  };

  return (
    <Layout
      darkMode={darkMode}
      switchDarkMode={handleSwitchTheme}
      renderCustomHeader={Header}
      classes={classes}
      shouldWrapContentBody={false}
    >
      {children}
    </Layout>
  );
}
