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
    if (!isSelected) {
      setActiveSlot('');
    }
  }, [isSelected]);

  useEffect(() => {
    const handleDoubleClick = (event) => {
      let target = event.target;

      if (!widgetId) {
        setActiveSlot(null);
        return;
      }

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
    const handleSingleClick = (event) => {
      let target = event.target;

      if (!widgetId) {
        setActiveSlot(null);
        return;
      }

      // Traverse up to find a valid main slot (not header/footer)
      while (target && target !== document.body) {
        if (
          target.id &&
          target.id.startsWith('canvas-') &&
          !target.id.endsWith('-header') &&
          !target.id.endsWith('-footer')
        ) {
          const slotId = target.id.replace(/^canvas-/, ''); // Strip "canvas-"
          setActiveSlot(slotId);
          return;
        }
        target = target.parentElement;
      }

      // If no main slot is found, fallback to widget ID
      setActiveSlot(widgetId);
    };

    // Attach single click if the widget is selected, otherwise listen for double-click

    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('click', handleSingleClick);

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('click', handleSingleClick);
    };
  }, [widgetId]); // Re-run when widgetId or selection state changes

  return activeSlot;
};
