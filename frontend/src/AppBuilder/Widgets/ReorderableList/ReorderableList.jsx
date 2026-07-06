import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './reorderableList.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import DOMPurify from 'dompurify';
import Markdown from 'react-markdown';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

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
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const { textColor } = styles;

  const { loadingState, disabledState, visibility, options, advanced, schema } = properties;

  const transformedOptions = advanced ? schema : options;

  const isInitialRender = useRef(true);
  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const formatOptions = (opts) => {
    return Array.isArray(opts)
      ? opts.map((option) => ({
          label: option.label,
          value: option.value,
          format: option.format || 'plain',
        }))
      : [];
  };

  // Store is the source of truth for the exposed `options` (same shape as
  // the old currentOptions); the resolved property is the pre-first-publish
  // fallback.
  const storeOptions = useExposedVariable(id, 'options', exposedOpts, undefined);
  const currentOptions =
    storeOptions !== undefined
      ? storeOptions
      : formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);

  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState || loadingState);

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

  // Reorder function
  const reorderOptions = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  // Handle drag end — no CSA/contract action exists for this (Bucket A
  // derived state), so it writes through directly, matching old.
  const onDragEnd = (result) => {
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }

    const reordered = reorderOptions(currentOptions, result.source.index, result.destination.index);

    setExposedVariables({
      options: formatOptions(reordered),
      values: reordered.map((option) => option.value),
    });
    fireEvent('onChange');
  };

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);
    setExposedVariables({
      options: opts,
      values: opts.map((option) => option.value),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transformedOptions]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers.
  useEffect(() => {
    const opts = formatOptions(Array.isArray(transformedOptions) ? transformedOptions : []);

    setExposedVariables({
      options: opts,
      values: opts.map((option) => option.value),
      isDisabled: disabledState || loadingState,
      isVisible: visibility,
      isLoading: loadingState,
      ...csaShims(),
    });

    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute container styles
  const containerStyle = {
    display: isVisible ? 'block' : 'none',
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
      {isLoading ? (
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
                    isDragDisabled={isDisabled}
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
