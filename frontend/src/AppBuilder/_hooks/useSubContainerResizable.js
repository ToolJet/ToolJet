import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  floorAtStart: false, // A start below minHeight keeps its own height as the floor, so the first pixel never jumps up to minHeight.
  getStartHeight: null, // Lets a caller whose element has a border or padding supply the height the drag starts from.
};

export const useSubContainerResizable = (options = {}) => {
  const props = { ...defaultProps, ...options };
  const parentRef = useRef(null);
  // The handle must stay one object across renders (so a memoised parent does not re-render), yet read the latest callbacks.
  const propsRef = useRef(props);
  propsRef.current = props;
  const removeListenersRef = useRef(null);
  useEffect(() => () => removeListenersRef.current?.(), []);
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

  const handleMouseDown = useCallback((e) => {
    // Prevent right-click drag activation (button === 2)
    if (e.button === 2) return;

    if (!parentRef.current) return;
    const props = propsRef.current;
    e.stopPropagation();
    e.preventDefault();
    const startHeight = props.getStartHeight ? props.getStartHeight() : parseInt(parentRef.current.clientHeight);
    const startWidth = parseInt(parentRef.current.clientWidth);
    const parentWidth = parentRef.current.parentElement ? parentRef.current.parentElement.clientWidth : startWidth;
    const startY = e.clientY;
    const startX = e.clientX;
    const isPercentage = typeof props.initialWidth === 'string' && props.initialWidth.includes('%');

    setIsDragging(true); // ✅ Set dragging state to true

    if (props.onDragStart) {
      props.onDragStart({ newHeight: startHeight, newWidth: startWidth });
    }

    let snappedHeight = startHeight;

    const handleMouseMove = (moveEvent) => {
      moveEvent.stopPropagation();
      moveEvent.preventDefault();
      let newHeight = startHeight;
      let newWidth = startWidth;

      if (!props.lockVertical) {
        const deltaY = props.isReverseVerticalDrag ? startY - moveEvent.clientY : moveEvent.clientY - startY;
        newHeight = startHeight + deltaY;
        if (props.floorAtStart && startHeight < props.minHeight && newHeight <= startHeight) {
          newHeight = startHeight;
        } else {
          newHeight = Math.max(props.minHeight, Math.min(props.maxHeight, newHeight));
          newHeight = Math.round(newHeight / props.stepHeight) * props.stepHeight; // Snap to stepHeight
        }
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

      snappedHeight = newHeight;
      setHeight(`${newHeight}px`);
      setWidth(newWidth);

      if (parentRef.current) {
        parentRef.current.style.height = `${newHeight}px`;
        // A locked axis keeps the element's own width; the number written here is ignored by browsers.
        if (!props.lockHorizontal) parentRef.current.style.width = newWidth;
      }

      propsRef.current.onResize?.({
        newHeight,
        newWidth,
        heightDiff: newHeight - startHeight,
        widthDiff: isPercentage
          ? parseInt(newWidth) - (startWidth / parentWidth) * 100
          : parseInt(newWidth) - startWidth,
      });
    };

    const removeListeners = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeListenersRef.current = null;
    };

    const handleMouseUp = () => {
      setIsDragging(false); // ✅ Set dragging state to false
      removeListeners();

      if (propsRef.current.onDragEnd) {
        // Get the updated height and width from the DOM instead of relying on state
        const finalHeight = parentRef.current ? parseInt(parentRef.current.clientHeight) : startHeight;
        const finalWidth = parentRef.current ? parseInt(parentRef.current.clientWidth) : startWidth;
        propsRef.current.onDragEnd({ newHeight: finalHeight, newWidth: finalWidth, snappedHeight });
      }
    };

    removeListenersRef.current = removeListeners;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleProps = useMemo(() => ({ onMouseDown: handleMouseDown }), [handleMouseDown]);
  const getHandleProps = useCallback(() => handleProps, [handleProps]);

  return { rootRef: parentRef, getRootProps, getHandleProps, getResizeState };
};

export default useSubContainerResizable;
