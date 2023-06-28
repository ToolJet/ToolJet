import { useState, useEffect } from 'react';

export default (_show, selector) => {
  const [show, setShow] = useState(_show);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (show && event.target.closest(selector) === null) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return [show, setShow];
};
