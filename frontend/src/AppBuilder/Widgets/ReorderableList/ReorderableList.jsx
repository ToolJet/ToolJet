import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './reorderableList.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const ReorderableList = (props) => {
  const { properties, styles, fireEvent, id, dataCy, setExposedVariable, setExposedVariables, darkMode } = props;

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

  // Ref for portal container
  const portalRef = useRef(null);

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
      sideEffect: () => {
        updateExposedVariablesState('isLoading', loadingState);
        setExposedVariable('isLoading', loadingState);
      },
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
      sideEffect: () => {
        updateExposedVariablesState('isDisabled', disabledState);
        setExposedVariable('isDisabled', disabledState);
      },
    },
    {
      dep: transformedOptions,
      sideEffect: () => {
        const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);
        setCurrentOptions(opts);
        setExposedVariable('options', opts);
        setExposedVariable(
          'values',
          opts.map((option) => option.value)
        );
      },
    },
  ]);

  // Initial exposed variables setup
  useEffect(() => {
    const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);
    setCurrentOptions(opts);

    const exposedVariables = {
      options: opts,
      values: opts.map((option) => option.value),
      isDisabled: disabledState || loadingState,
      isVisible: visibility,
      isLoading: loadingState,
      setDisable: async function (value) {
        updateExposedVariablesState('isDisabled', !!value);
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        updateExposedVariablesState('isVisible', !!value);
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        updateExposedVariablesState('isLoading', !!value);
        setExposedVariable('isLoading', !!value);
      },
    };

    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute container styles
  const containerStyle = {
    display: exposedVariablesTemporaryState.isVisible ? 'block' : 'none',
    height: '100%',
    width: '100%',
    overflow: 'auto',
  };

  const hasNoOptions = !currentOptions || currentOptions.length === 0;

  // Render label content based on format
  const renderLabel = (text, format) => {
    if (!text) return '';
    const safeText = typeof text === 'object' ? JSON.stringify(text) : text;
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
      >
        {renderLabel(item.label || item.value, item.format)}
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
      className={cx('reorderable-list-container', { 'dark-theme': darkMode, 'is-disabled': disabledState })}
      style={containerStyle}
      data-cy={dataCy}
      role="list"
      aria-label="Reorderable list"
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
                  <Draggable
                    key={item.value || index}
                    draggableId={String(item.value || index)}
                    index={index}
                    isDragDisabled={exposedVariablesTemporaryState.isDisabled}
                  >
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
