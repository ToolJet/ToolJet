import React from 'react';
import Select from '@/_ui/Select';

export const RenderEditor = ({ annotation, labels, onCreate, darkMode, selectElementStyles }) => {
  const { geometry } = annotation;
  if (!geometry) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${annotation.geometry.x}%`,
        top: `${annotation.geometry.y + annotation.geometry.height}%`,
        right: `${annotation.geometry.x + annotation.geometry.width}%`,
        width: `${annotation.geometry.width}%`,
        minWidth: '125px',
      }}
      className="col"
    >
      <Select
        aria-label="Label for new annotation"
        options={labels}
        onChange={(value) => onCreate(geometry, value)}
        className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
        useCustomStyles={true}
        useMenuPortal
        styles={selectElementStyles(darkMode, '100%')}
      />
    </div>
  );
};
