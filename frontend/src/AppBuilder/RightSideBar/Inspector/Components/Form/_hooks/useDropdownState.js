import { useState, useCallback } from 'react';

export const useDropdownState = () => {
  const [dropdownState, setDropdownState] = useState('closed'); // 'closed' | 'opening' | 'open'

  const handleDropdownOpen = useCallback(() => {
    setDropdownState('open');
  }, []);

  const handleDropdownClose = useCallback(() => {
    setDropdownState('closing');
    setTimeout(() => setDropdownState('closed'), 100);
  }, []);

  const shouldPreventPopoverClose = dropdownState !== 'closed';

  return {
    dropdownState,
    handleDropdownOpen,
    handleDropdownClose,
    shouldPreventPopoverClose,
  };
};
