import { useRef, useState } from 'react';

const defaultProps = {
  minHeight: 50,
  maxHeight: 600,
  minWidth: 50,
  maxWidth: 600,
  lockHorizontal: false,
  lockVertical: false,
  stepHeight: 10, // Default step size for height
  stepWidth: 10, // Default step size for width
  onResize: null,
  onDragStart: null,
  onDragEnd: null,
  isReverseVerticalDrag: false,
};

export const useSubContainerResizable = (options = {}) => {
  const props = { ...defaultProps, ...options };
  const parentRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false); // ✅ Track dragging state

  const [height, setHeight] = useState(
    typeof props.initialHeight === 'string' ? props.initialHeight : `${props.initialHeight || 200}px`
  );
  const [width, setWidth] = useState(
    typeof props.initialWidth === 'string' ? props.initialWidth : `${props.initialWidth || 200}px`
  );

  const getRootProps = () => ({
    ref: parentRef,
    style: { height, width },
  });

  const getResizeState = () => ({
    height,
    width,
    isDragging,
  });

  const getHandleProps = () => {
    const handleMouseDown = (e) => {
      // Prevent right-click drag activation (button === 2)
      if (e.button === 2) return;

      if (!parentRef.current) return;
      e.stopPropagation();
      e.preventDefault();
      const startHeight = parseInt(parentRef.current.clientHeight);
      const startWidth = parseInt(parentRef.current.clientWidth);
      const parentWidth = parentRef.current.parentElement ? parentRef.current.parentElement.clientWidth : startWidth;
      const startY = e.clientY;
      const startX = e.clientX;
      const isPercentage = typeof props.initialWidth === 'string' && props.initialWidth.includes('%');

      setIsDragging(true); // ✅ Set dragging state to true

      if (props.onDragStart) {
        props.onDragStart({ newHeight: startHeight, newWidth: startWidth });
      }

      const handleMouseMove = (moveEvent) => {
        moveEvent.stopPropagation();
        moveEvent.preventDefault();
        let newHeight = startHeight;
        let newWidth = startWidth;

        if (!props.lockVertical) {
          const deltaY = props.isReverseVerticalDrag ? startY - moveEvent.clientY : moveEvent.clientY - startY;
          newHeight = startHeight + deltaY;
          newHeight = Math.max(props.minHeight, Math.min(props.maxHeight, newHeight));
          newHeight = Math.round(newHeight / props.stepHeight) * props.stepHeight; // Snap to stepHeight
        }

        if (!props.lockHorizontal) {
          newWidth = startWidth + (moveEvent.clientX - startX);
          newWidth = Math.max(props.minWidth, Math.min(props.maxWidth, newWidth));
          newWidth = Math.round(newWidth / props.stepWidth) * props.stepWidth; // Snap to stepWidth

          if (isPercentage) {
            newWidth = (newWidth / parentWidth) * 100; // Convert to percentage
            newWidth = `${newWidth.toFixed(2)}%`;
          } else {
            newWidth = `${newWidth}px`;
          }
        }

        setHeight(`${newHeight}px`);
        setWidth(newWidth);

        if (parentRef.current) {
          parentRef.current.style.height = `${newHeight}px`;
          parentRef.current.style.width = newWidth;
        }

        if (props.onResize) {
          props.onResize({
            newHeight,
            newWidth,
            heightDiff: newHeight - startHeight,
            widthDiff: isPercentage
              ? parseInt(newWidth) - (startWidth / parentWidth) * 100
              : parseInt(newWidth) - startWidth,
          });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false); // ✅ Set dragging state to false

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (props.onDragEnd) {
          // Get the updated height and width from the DOM instead of relying on state
          const finalHeight = parentRef.current ? parseInt(parentRef.current.clientHeight) : parseInt(height);
          const finalWidth = parentRef.current ? parseInt(parentRef.current.clientWidth) : parseInt(width);
          console.log(finalHeight, 'dragEnd');
          props.onDragEnd({ newHeight: finalHeight, newWidth: finalWidth });
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    return {
      onMouseDown: handleMouseDown,
    };
  };

  return { rootRef: parentRef, getRootProps, getHandleProps, getResizeState };
};

export default useSubContainerResizable;
