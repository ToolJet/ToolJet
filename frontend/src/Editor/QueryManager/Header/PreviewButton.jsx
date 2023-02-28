import React from 'react';
import QMIcons from '../QMIcons';

export default function PreviewButton(props) {
  const { previewLoading, darkMode, selectedDataSource, label, onPreview, show } = props;

  if (!show) {
    return '';
  }

  return (
    <button
      onClick={onPreview}
      className={`default-tertiary-button float-right1 ${
        previewLoading ? (darkMode ? 'btn-loading' : 'button-loading') : ''
      } ${darkMode ? 'theme-dark ' : ''} ${selectedDataSource ? '' : 'disabled'}`}
      data-cy={'query-preview-button'}
    >
      <span
        className="query-preview-svg d-flex align-items-center query-icon-wrapper"
        style={{ width: '16px', height: '16px', padding: '2.67px 0.67px', margin: '6px 0' }}
      >
        <QMIcons.Eye />
      </span>
      <span>{label}</span>
    </button>
  );
}
