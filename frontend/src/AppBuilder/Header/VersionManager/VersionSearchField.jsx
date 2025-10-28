import React from 'react';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const VersionSearchField = ({ value, onChange, placeholder = 'Search versions by name...' }) => {
  return (
    <div className="version-search-field" style={{ padding: '8px' }}>
      <div
        className="d-flex align-items-center"
        style={{
          backgroundColor: 'white',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          padding: '7px 12px',
          gap: '6px',
        }}
      >
        <SolidIcon width="16" name="search" />
        <input
          type="text"
          className="flex-grow-1 tj-text-sm"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-default)',
            fontFamily: 'IBM Plex Sans',
            fontSize: '12px',
            lineHeight: '18px',
          }}
        />
      </div>
    </div>
  );
};

export default VersionSearchField;
