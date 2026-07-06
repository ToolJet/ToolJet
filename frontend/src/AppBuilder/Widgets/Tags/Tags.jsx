import React, { useEffect, useRef } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import Spinner from '@/_ui/Spinner';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';
import './tags.scss';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/mediaC';

export const Tags = function Tags({
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
  id,
  fireEvent,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const {
    data,
    advanced,
    schema,
    options,
    overflow,
    loadingState: tagsLoadingState,
    disabledState,
    visibility,
  } = properties;
  const { boxShadow, alignment, borderRadius, size } = styles;

  const isInitialRender = useRef(true);
  const containerRef = useRef(null);

  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, tagsLoadingState);
  const isDisabled = useExposedVariable(id, 'isDisabled', exposedOpts, disabledState);

  // Follow the exact same pattern as Tabs: use tagItems for static, schema/data for dynamic
  let tagsData;
  if (!advanced) {
    // In static mode, use tagItems (same as tabs uses tabItems)
    tagsData = options;
  } else {
    // In dynamic mode, prefer data over schema (data seems to be the primary source)
    if (Array.isArray(data) && data.length > 0) {
      tagsData = data;
    } else {
      tagsData = data || schema || [];
    }
  }

  // Resolve dynamic values - similar to tabs resolveWidgetFieldValue for dynamic mode
  if (advanced && typeof tagsData === 'string') {
    tagsData = resolveWidgetFieldValue(tagsData);
  }

  let parsedTags = tagsData;
  if (Array.isArray(parsedTags)) {
    parsedTags = parsedTags
      ?.filter((tag) => {
        const isVisible = tag?.visible?.value !== undefined ? tag.visible.value : tag?.visible !== false;
        return isVisible;
      })
      ?.map((tag, index) => ({
        ...tag,
        id: tag.id ? tag.id : index,
      }));
  }

  // ===== EFFECTS (property-sync write-throughs; skip-initial) ──────────
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', tagsLoadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsLoadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const _tags = parsedTags?.map(({ title }) => title) || [];
    setExposedVariable('tags', _tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(parsedTags ?? [])]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers.
  useEffect(() => {
    const _tags = parsedTags?.map(({ title }) => title) || [];
    setExposedVariables({
      tags: _tags,
      ...csaShims(),
      isVisible: visibility,
      isLoading: tagsLoadingState,
      isDisabled: disabledState,
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedStyles = {
    width,
    height,
    opacity: isDisabled ? 0.5 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    ...(overflow === 'wrap'
      ? {
          display: isVisible ? 'flex' : 'none',
          flexWrap: 'wrap',
          overflowY: 'auto',
          overflowX: 'hidden',
          justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          margin: '0 -3px -3px 0',
        }
      : {
          display: isVisible ? 'flex' : 'none',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
          justifyContent: 'flex-start',
        }),
  };

  function getTagIcon(tag, tagDataCy) {
    const iconName = tag?.icon?.value || tag?.icon;
    const iconVisible =
      tag?.iconVisibility?.value !== undefined
        ? tag.iconVisibility.value
        : tag?.iconVisibility !== undefined
        ? tag.iconVisibility
        : false;

    if (!iconName || !iconVisible) return null;

    return (
      <TablerIcon
        iconName={iconName}
        style={{
          width: size === 'small' ? '12px' : '16px',
          height: size === 'small' ? '12px' : '16px',
          marginRight: '4px',
        }}
        stroke={1.5}
        data-cy={`${tagDataCy}-icon`}
        role="img"
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  function renderTag(item, index) {
    const backgroundColor = item.backgroundColor || item.color;

    const isTagVisible = item.visible?.value !== undefined ? item.visible.value : item.visible !== false;
    if (!isTagVisible) return null;

    const isComponentDisabled = isDisabled;

    const textColor = item.textColor;

    // Generate data-cy for individual tag
    const tagDataCy = generateCypressDataCy(`${dataCy}-tag-${item.title || index}`);

    const getSizeStyles = () => {
      if (size === 'small') {
        return {
          padding: '4px 9px',
          height: '20px',
          fontSize: '12px',
          fontWeight: 500,
        };
      } else if (size === 'large') {
        return {
          padding: '4px 12px',
          height: '28px',
          fontSize: '14px',
          fontWeight: 500,
        };
      } else {
        return {
          padding: '4px 10px',
          height: '16px',
          fontSize: '13px',
          fontWeight: 500,
        };
      }
    };

    const sizeStyles = getSizeStyles();

    const tagComputedStyles = {
      backgroundColor: backgroundColor,
      color: textColor,
      textTransform: 'none',
      opacity: isComponentDisabled ? 0.5 : 1,
      pointerEvents: isComponentDisabled ? 'none' : 'auto',
      display: 'inline-flex',
      alignItems: 'center',
      cursor: isComponentDisabled ? 'not-allowed' : 'default',
      flexShrink: overflow === 'wrap' ? 1 : 0,
      margin: overflow === 'wrap' ? '0 3px 3px 0' : '0 3px 0 0',
      borderRadius: borderRadius + 'px' || '0.25rem',
      outline: 'none',
      ...sizeStyles,
      boxSizing: 'border-box',
      minHeight: sizeStyles.height,
    };

    const tagTitle = getSafeRenderableValue(item.title);
    const hasIcon = getTagIcon(item, tagDataCy) !== null;

    return (
      <span
        className="badge"
        style={tagComputedStyles}
        key={index + item.title}
        data-cy={tagDataCy}
        data-index={index}
        role="text"
        aria-label={`${tagTitle}${hasIcon ? ' with icon' : ''}`}
      >
        {getTagIcon(item, tagDataCy)}
        {tagTitle}
      </span>
    );
  }

  return (
    <div
      style={{
        boxShadow,
      }}
      className="w-100 overflow-hidden"
      role="region"
      aria-label="Tags widget container"
    >
      <div
        className="tag-comp-wrapper"
        style={computedStyles}
        data-cy={`draggable-widget-${dataCy}`}
        ref={containerRef}
        role="group"
        aria-label={`Tags display: ${parsedTags?.length || 0} tags`}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <div
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}
            data-cy={`${dataCy}-loading-spinner`}
            role="status"
            aria-label="Loading tags"
          >
            <Spinner />
          </div>
        ) : (
          <>
            {overflow === 'wrap' ? (
              <div
                data-cy={`${dataCy}-tags-container`}
                role="group"
                aria-label={`Tag collection with ${parsedTags?.length || 0} items`}
                style={{
                  outline: 'none',
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                  alignContent: 'flex-start',
                  width: '100%',
                }}
              >
                {parsedTags &&
                  Array.isArray(parsedTags) &&
                  parsedTags.map((item, index) => {
                    return renderTag(item, index);
                  })}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
                  minWidth: 'fit-content',
                }}
              >
                <div
                  data-cy={`${dataCy}-tags-container`}
                  role="group"
                  aria-label={`Tag collection with ${parsedTags?.length || 0} items`}
                  style={{
                    outline: 'none',
                    display: 'flex',
                    minWidth: 'fit-content',
                  }}
                >
                  {parsedTags &&
                    Array.isArray(parsedTags) &&
                    parsedTags.map((item, index) => {
                      return renderTag(item, index);
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
