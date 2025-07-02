import React, { useEffect } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { showGridLines, hideGridLines } from '@/AppBuilder/AppCanvas/Grid/gridUtils';
import { useSubContainerResizable } from '@/AppBuilder/_hooks/useSubContainerResizable';

export const HorizontalSlot = React.memo(
  ({
    id,
    height = 0,
    width,
    darkMode,
    isDisabled,
    isActive,
    slotName = 'header', // 'header' or 'footer'
    slotStyle = {},
    onResize,
    isEditing,
    maxHeight,
    componentType,
  }) => {
    const parsedHeight = parseInt(height, 10);
    const { getRootProps, getHandleProps, getResizeState } = useSubContainerResizable({
      initialHeight: parsedHeight,
      initialWidth: '100%', // Now respects parent's width
      minHeight: 10,
      maxHeight: maxHeight || 400,
      maxWidth: '100%',
      stepHeight: 10, // Height will change in steps of 10px
      onResize: () => {},
      onDragEnd: (values) => {
        onResize(values);
      },
      isReverseVerticalDrag: slotName === 'footer', // Reverse dragging for Footer
    });

    const { height: resizedHeight, isDragging } = getResizeState();
    useEffect(() => {
      if (isDragging) {
        showGridLines();
      } else {
        hideGridLines();
      }
    }, [isDragging, id]);

    const canvasHeight = parseInt(resizedHeight, 10) / 10;

    const resizeStyle = {
      backgroundColor: darkMode ? '#1F2837' : '#fff',
    };

    return (
      <div
        className={`jet-${componentType?.toLowerCase()}-${slotName} wj-${componentType?.toLowerCase()}-${slotName}`}
        style={slotStyle}
      >
        <div
          className={`resizable-slot only-${slotName} ${isActive ? 'active' : ''}  ${isEditing && 'is-editing'} ${
            isDragging ? 'dragging' : ''
          }`}
          {...getRootProps()}
        >
          <SubContainer
            id={id}
            canvasHeight={canvasHeight}
            canvasWidth={width}
            allowContainerSelect={false}
            darkMode={darkMode}
            styles={{
              margin: 0,
              backgroundColor: 'transparent',
              overflow: 'hidden',
            }}
            componentType={componentType}
          />
          {isEditing && <div className="resize-handle" {...getHandleProps()} style={resizeStyle} />}
        </div>

        {isDisabled && (
          <div
            id={`${id}-disabled`}
            className="tj-form-disabled-overlay"
            style={{ height: resizedHeight || '100%' }}
            onClick={() => {}}
            onDrop={(e) => e.stopPropagation()}
          />
        )}
      </div>
    );
  }
);
