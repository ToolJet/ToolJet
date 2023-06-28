import { useState, useEffect } from 'react';

export default (_show, selector) => {
  const [show, setShow] = useState(_show);

  const handleClickOutside = (event) => {
    if (show && event.target.closest(selector) === null) {
      setShow(false);
    }
  };

  useEffect(() => {
    show && document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show]);

  return [show, setShow];
};
