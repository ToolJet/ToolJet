import React, { useMemo } from 'react';
import { useActiveSlot } from '@/AppBuilder/_hooks/useActiveSlot';
import { HorizontalSlot } from '@/AppBuilder/Widgets/Form/Components/HorizontalSlot';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { CONTAINER_FORM_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import TablerIcon from '@/_ui/Icon/TablerIcon';

const Header = (props) => {
  const {
    id,
    height,
    width,
    isDynamicHeightEnabled,
    headerBackgroundColor,
    darkMode,
    borderRadius,
    headerHeight,
    isExpanded,
    setExpanded,
    fireEvent,
    isDisabled,
    chevronIconColor,
  } = props;

  const setComponentProperty = useStore((state) => state.setComponentProperty, shallow);
  const activeSlot = useActiveSlot(id); // Track the active slot for this widget
  const headerMaxHeight = isDynamicHeightEnabled ? 10000 : parseInt(height, 10) - 100 - 10;

  const headerBgColor = useMemo(() => {
    return {
      backgroundColor:
        ['#fff', '#ffffffff'].includes(headerBackgroundColor) && darkMode ? '#232E3C' : headerBackgroundColor,
    };
  }, [headerBackgroundColor, darkMode]);

  const containerHeaderStyles = useMemo(() => {
    return {
      flexShrink: 0,
      padding: `${CONTAINER_FORM_CANVAS_PADDING}px ${CONTAINER_FORM_CANVAS_PADDING}px 3px ${CONTAINER_FORM_CANVAS_PADDING}px`,
      maxHeight: `${headerMaxHeight}px`,
      borderTopLeftRadius: `${borderRadius}px`,
      borderTopRightRadius: `${borderRadius}px`,
      ...(!isExpanded && { borderBottomLeftRadius: `${borderRadius}px` }),
      ...headerBgColor,
    };
  }, [headerMaxHeight, borderRadius, isExpanded, headerBgColor]);

  const updateHeaderSizeInStore = ({ newHeight }) => {
    const _height = parseInt(newHeight, 10);
    setComponentProperty(id, `headerHeight`, _height, 'properties', 'value', false);
  };

  return (
    <div className="tj-accordion-header" style={{ ...headerBgColor }}>
      <div className="tw-h-full tw-w-full">
        <HorizontalSlot
          slotName={'header'}
          slotStyle={containerHeaderStyles}
          id={`${id}-header`}
          height={headerHeight}
          width={width}
          darkMode={darkMode}
          isDisabled={isDisabled}
          isActive={activeSlot === `${id}-header`}
          onResize={updateHeaderSizeInStore}
          componentType="Container"
        />
      </div>
      <div className="tj-accordion-close-btn">
        <button
          type="button"
          disabled={isDisabled}
          aria-label={isExpanded ? 'Collapse accordion' : 'Expand accordion'}
          data-cy={`accordion-close-button`}
          onClick={(e) => {
            if (isDisabled) return;
            e.stopPropagation();
            const expand = !isExpanded;
            setExpanded(expand);
            fireEvent(expand ? 'onExpand' : 'onCollapse');
          }}
        >
          <TablerIcon
            iconName="IconChevronUp"
            size={24}
            color={chevronIconColor}
            className={`tw-transition-transform tw-duration-200 ${isExpanded ? '' : 'tw-rotate-180'}`}
          />
        </button>
      </div>
    </div>
  );
};

export default Header;
