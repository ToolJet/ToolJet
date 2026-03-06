import React, { useState, useEffect } from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';

const STORAGE_KEY = 'dataSourceRenameBannerClosed';

 const PostMigrationDataSourceRenameBanner = ({ darkMode = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const closed = localStorage.getItem(STORAGE_KEY);
    if (!closed) setVisible(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className={`post-migration-banner ${darkMode ? 'dark-mode' : ''}`}>
      <div className="banner-left-section">
        <SolidIcon name="warning" fill={darkMode ? '#60A5FA' : '#3B82F6'} width={28} height={28} />

        <div className="banner-text-container">
          <div className="banner-title">Data sources renamed</div>

          <div className="banner-description">
            To prevent naming conflicts, we’ve automatically renamed a few data sources. Everything else remains unchanged.
          </div>
        </div>
      </div>

      <button className="banner-close-button" onClick={handleClose}>
        ✕
      </button>
    </div>
  );
};

export default PostMigrationDataSourceRenameBanner;