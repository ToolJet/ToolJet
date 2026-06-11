/* Props
 src = source
 className = custom css class for lazyload wrapper
 spinnerClassName = custom css class for spinner
 useSmallSpinner = boolean value to change default spinner to smaller spinner [default: false]
*/

import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';

export const ImageWithSpinner = ({ src, className, spinnerClassName, useSmallSpinner }) => {
  const [isloaded, setLoaded] = useState(false);

  return (
    <>
      <LazyLoadImage
        src={src}
        className={className}
        beforeLoad={() => setLoaded(false)}
        afterLoad={() => setLoaded(true)}
      />
      {!isloaded && (
        <div
          className={`spinner-border text-center ${spinnerClassName ?? ''} ${
            useSmallSpinner ? 'spinner-border-sm' : ''
          }`}
          role="status"
        ></div>
      )}
    </>
  );
};
