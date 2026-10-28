import React, { useEffect, useState, useRef, useCallback } from 'react';
import { isEqual } from 'lodash';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './reorderableList.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { useHeightObserver } from '@/_hooks/useHeightObserver';

export const ReorderableList = (props) => {
  const {
    properties,
    styles,
    fireEvent,
    id,
    dataCy,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    height,
    width,
    currentLayout,
    currentMode,
    subContainerIndex,
    componentType,
  } = props;

  const { textColor } = styles;

  const { loadingState, disabledState, visibility, options, advanced, schema } = properties;

  const transformedOptions = advanced ? schema : options;

  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState || loadingState,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const [currentOptions, setCurrentOptions] = useState([]);
  // Disable control (property or setDisable) kept apart from loading so loading end restores it.
  const disableControlRef = useRef(disabledState);
  // Last synced source content; equal re-resolutions must not discard the user's order.
  const syncedOptionsRef = useRef(null);

  // Ref for portal container
  const portalRef = useRef(null);

  const isDynamicHeightEnabled = properties.dynamicHeight && currentMode === 'view';
  // Item labels can be Markdown/HTML, so a rendered item's height isn't a pure function of the
  // options string (rich markup, wrapping, async content). Observe the rendered container like
  // a Text widget. NOTE: observe this new ref, NOT the Droppable's innerRef (react-beautiful-dnd owns that one).
  const contentRef = useRef(null);
  const heightChangeValue = useHeightObserver(contentRef, isDynamicHeightEnabled);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    value: heightChangeValue,
    currentLayout,
    width,
    visibility: exposedVariablesTemporaryState.isVisible,
    subContainerIndex,
    componentType,
  });

  // Create portal container on mount
  useEffect(() => {
    const portal = document.createElement('div');
    portal.setAttribute('data-reorderable-list-portal', id);
    document.body.appendChild(portal);
    portalRef.current = portal;

    return () => {
      if (portalRef.current) {
        document.body.removeChild(portalRef.current);
      }
    };
  }, [id]);

  const formatOptions = (opts) => {
    return Array.isArray(opts)
      ? opts.map((option) => ({
          label: option.label,
          value: option.value,
          format: option.format || 'plain',
        }))
      : [];
  };

  // Internal per-card identity; never exposed, so values may be falsy or duplicated.
  const withDragIds = (opts) => opts.map((option, index) => ({ ...option, dragId: `item-${index}` }));

  const syncOptions = (opts) => {
    syncedOptionsRef.current = opts;
    setCurrentOptions(withDragIds(opts));
    setExposedVariable('options', opts);
    setExposedVariable(
      'values',
      opts.map((option) => option.value)
    );
  };

  const applyLoading = (isLoading) => {
    updateExposedVariablesState('isLoading', isLoading);
    setExposedVariable('isLoading', isLoading);
    if (!isLoading) {
      updateExposedVariablesState('isDisabled', disableControlRef.current);
      setExposedVariable('isDisabled', disableControlRef.current);
    }
  };

  const applyDisable = (isDisabled) => {
    disableControlRef.current = isDisabled;
    updateExposedVariablesState('isDisabled', isDisabled);
    setExposedVariable('isDisabled', isDisabled);
  };

  // Reorder function
  const reorderOptions = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Handle drag end
  const onDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }

    const reordered = reorderOptions(currentOptions, result.source.index, result.destination.index);

    setCurrentOptions(reordered);
    setExposedVariable('options', formatOptions(reordered));
    setExposedVariable(
      'values',
      reordered.map((option) => option.value)
    );
    fireEvent('onChange');
  };

  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => applyLoading(loadingState),
    },
    {
      dep: properties.visibility,
      sideEffect: () => {
        updateExposedVariablesState('isVisible', visibility);
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => applyDisable(disabledState),
    },
    {
      dep: transformedOptions,
      sideEffect: () => {
        const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);
        if (isEqual(opts, syncedOptionsRef.current)) return;
        syncOptions(opts);
      },
    },
  ]);

  // Initial exposed variables setup
  useEffect(() => {
    const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);
    syncedOptionsRef.current = opts;
    setCurrentOptions(withDragIds(opts));

    const exposedVariables = {
      options: opts,
      values: opts.map((option) => option.value),
      isDisabled: disabledState || loadingState,
      isVisible: visibility,
      isLoading: loadingState,
      setDisable: async function (value) {
        applyDisable(!!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        applyLoading(!!value);
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute container styles
  const containerStyle = {
    display: exposedVariablesTemporaryState.isVisible ? 'block' : 'none',
    height: isDynamicHeightEnabled ? 'auto' : '100%',
    ...(isDynamicHeightEnabled && { minHeight: height }),
    width: '100%',
    overflow: isDynamicHeightEnabled ? 'visible' : 'auto',
  };

  const hasNoOptions = !currentOptions || currentOptions.length === 0;

  // Render label content based on format
  const renderLabel = (text, format) => {
    if (text === null || text === undefined || text === '') return '';
    const safeText = typeof text === 'object' ? JSON.stringify(text) : String(text);
    switch (format) {
      case 'markdown':
        return <Markdown className={'reactMarkdown'}>{safeText}</Markdown>;
      case 'html':
        return (
          <span
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(safeText || ''),
            }}
          />
        );
      case 'plain':
      default:
        return <span>{safeText}</span>;
    }
  };

  const isDisabled = exposedVariablesTemporaryState.isDisabled;
  const hasLabel = (label) => label !== null && label !== undefined && label !== '';

  // Render draggable item - uses portal when dragging to avoid transform issues
  const renderDraggableItem = (item, _index) => (provided, snapshot) => {
    const itemContent = (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cx('reorderable-list-item', { 'is-dragging': snapshot.isDragging })}
        style={{
          ...provided.draggableProps.style,
          color: textColor,
        }}
        role="listitem"
        aria-roledescription={isDisabled ? undefined : 'draggable item'}
        aria-disabled={isDisabled || undefined}
      >
        {renderLabel(hasLabel(item.label) ? item.label : item.value, item.format)}
      </div>
    );

    // // When dragging, render in portal to escape parent transforms
    if (snapshot.isDragging && portalRef.current) {
      return createPortal(itemContent, portalRef.current);
    }

    return itemContent;
  };

  return (
    <div
      ref={contentRef}
      className={cx('reorderable-list-container', { 'dark-theme': darkMode, 'is-disabled': isDisabled })}
      style={containerStyle}
      data-cy={dataCy}
      role="list"
      aria-label="Reorderable list"
      aria-disabled={isDisabled || undefined}
    >
      {exposedVariablesTemporaryState.isLoading ? (
        <Loader style={{ right: '50%', top: '50%' }} width="20" />
      ) : hasNoOptions ? (
        <div className="reorderable-list-empty">No items</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`reorderable-list-${id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="reorderable-list-items">
                {currentOptions.map((item, index) => (
                  <Draggable key={item.dragId} draggableId={item.dragId} index={index} isDragDisabled={isDisabled}>
                    {renderDraggableItem(item, index)}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
};
