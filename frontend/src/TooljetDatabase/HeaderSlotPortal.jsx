import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const TJDB_HEADER_SLOT_ID = 'tjdb-header-slot';

// The page Header is rendered by the layout route, above TooljetDatabaseProvider, so a component
// mounted there cannot read the page's context. The page portals its header content into the
// Header's slot from inside the provider instead.
export const HeaderSlotPortal = ({ children }) => {
  const [slot, setSlot] = useState(null);

  // In an effect, not render: this page is lazy-loaded, so the Header (and its slot) is already mounted.
  useEffect(() => {
    setSlot(document.getElementById(TJDB_HEADER_SLOT_ID));
  }, []);

  return slot ? createPortal(children, slot) : null;
};
