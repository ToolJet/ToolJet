import React from 'react';
import LazyLoad from 'react-lazyload';

export const Image = function Image({ height, properties, styles, fireEvent, offset }) {
  const source = properties.source;
  const widgetVisibility = styles.visibility ?? true;

  function Placeholder() {
    return <div className="skeleton-image" style={{ objectFit: 'contain', height }}></div>;
  }

  return (
    <div data-disabled={styles.disabledState} style={{ display: widgetVisibility ? '' : 'none' }}>
      <LazyLoad offset={offset > 0 ? offset : 0} height={height} placeholder={<Placeholder />} debounce={500}>
        <img src={source} height={height} onClick={() => fireEvent('onClick')} />
      </LazyLoad>
    </div>
  );
};
