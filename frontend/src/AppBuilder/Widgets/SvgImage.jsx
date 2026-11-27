import React from 'react';
import DOMPurify from 'dompurify';
import { themedShadow } from '@/AppBuilder/_helpers/themeStyles';

export const SvgImage = function Timeline({ properties, styles, height, dataCy, id }) {
  const { visibility, boxShadow: savedBoxShadow, boxShadowStyle, alignment } = styles;
  // The theme shadow (or this widget's own) as CSS.
  const boxShadow = themedShadow(boxShadowStyle, savedBoxShadow);
  const { data } = properties;
  return (
    <div style={{ display: visibility ? '' : 'none', overflow: 'hidden', height: height, boxShadow }} data-cy={dataCy}>
      <div
        role="img"
        id={`component-${id}`}
        style={{ display: 'flex', justifyContent: alignment }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
      ></div>
    </div>
  );
};
