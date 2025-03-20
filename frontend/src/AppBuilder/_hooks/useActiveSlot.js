import { useState, useEffect } from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const useIsWidgetSelected = (id) => {
  // Get selected components from store using shallow comparison
  const selectedComponents = useStore((state) => state.selectedComponents, shallow);

  // Check if the only selected component is the provided `id`
  return selectedComponents.length === 1 && selectedComponents[0] === id;
};


export const useActiveSlot = (widgetId) => {
  const [activeSlot, setActiveSlot] = useState(''); // Default to widget ID
  const isSelected = useIsWidgetSelected(widgetId); // Check if widget is selected
  useEffect(() => {
    const handleClick = (event) => {
      let target = event.target;

      // Traverse up to find a slot with an id
      while (target && target !== document.body) {
        if (target.id && target.id.startsWith('canvas-')) {
          const slotId = target.id.replace(/^canvas-/, ''); // ✅ Strip "canvas-"
          setActiveSlot(slotId);
          return;
        }
        target = target.parentElement;
      }

      // If no slot is found, reset to widget ID
      setActiveSlot(widgetId);
    };

    // Attach single click if the widget is selected, otherwise listen for double-click
    const eventType = isSelected ? 'click' : 'dblclick';

    document.addEventListener(eventType, handleClick);

    return () => {
      document.removeEventListener(eventType, handleClick);
    };
  }, [widgetId, isSelected]); // Re-run when widgetId or selection state changes

  return activeSlot;
};
