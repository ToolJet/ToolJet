import { useState, useEffect } from 'react';

export default (_show, selector, triggerSelector) => {
  const [show, setShow] = useState(_show);

  const handleClickOutside = (event) => {
    if (triggerSelector && event.target.closest(triggerSelector) !== null) {
      return;
    }
    if (show && event.target.closest(selector) === null) {
      setShow(false);
    }
  };

  useEffect(() => {
    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);

  return [show, setShow];
};
