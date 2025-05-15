import React, { useState } from 'react';
import Select from '@/_ui/Select';
import usePopoverObserver from '@/AppBuilder/_hooks/usePopoverObserver';

const QuerySelect = ({ customClassPrefix, onMenuOpen, onMenuClose, ...props }) => {
  const [showModal, setShowModal] = useState(false);

  usePopoverObserver(
    document.getElementsByClassName('query-details')[0],
    document.querySelector(`.${customClassPrefix}.react-select__control`),
    document.querySelector(`.${customClassPrefix}.react-select__menu`),
    showModal,
    () => (document.querySelector(`.${customClassPrefix}.react-select__menu`).style.display = 'block'),
    () => (document.querySelector(`.${customClassPrefix}.react-select__menu`).style.display = 'none')
  );

  const handleMenuOpen = () => {
    setShowModal(true);
    onMenuOpen?.();
  };

  const handleMenuClose = () => {
    setShowModal(false);
    onMenuClose?.();
  };

  return (
    <Select
      {...props}
      customClassPrefix={customClassPrefix}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
    />
  );
};

export default QuerySelect;
