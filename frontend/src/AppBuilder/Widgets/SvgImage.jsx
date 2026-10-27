import React from 'react';
import { sanitizeSvg } from '@/_helpers/sanitizeHtml';

export const SvgImage = function Timeline({ properties, styles, height, dataCy, id }) {
  const { visibility, boxShadow, alignment } = styles;
  const { data } = properties;
  return (
    <div style={{ display: visibility ? '' : 'none', overflow: 'hidden', height: height, boxShadow }} data-cy={dataCy}>
      <div
        role="img"
        id={`component-${id}`}
        style={{ display: 'flex', justifyContent: alignment }}
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(data) }}
      ></div>
    </div>
  );
};
