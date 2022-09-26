import React from 'react';
import { Header } from '@/_components';
import StorageLayerPageHeader from './PageHeader';
import StorageLayerPageBody from './PageBody';

export const StorageLayer = ({ switchDarkMode, darkMode }) => {
  return (
    <div className="page-wrapper">
      <Header switchDarkMode={switchDarkMode} darkMode={darkMode} />
      <StorageLayerPageHeader />
      <StorageLayerPageBody />
    </div>
  );
};
