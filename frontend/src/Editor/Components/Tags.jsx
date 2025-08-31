import React, { useState, useEffect } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { getSafeRenderableValue } from '@/Editor/Components/utils';
import * as Icons from '@tabler/icons-react';
import Spinner from '@/_ui/Spinner';

export const Tags = function Tags({ width, height, properties, styles, dataCy, setExposedVariable }) {
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

  console.log('Tags component properties:', properties);

  const [isTagsVisible, setIsTagsVisible] = useState(visibility);
  const [isTagsLoading, setIsTagsLoading] = useState(tagsLoadingState);
  const [isTagsDisabled, setIsTagsDisabled] = useState(disabledState);

  useEffect(() => {
    if (isTagsVisible !== visibility) setIsTagsVisible(visibility);
    if (isTagsLoading !== tagsLoadingState) setIsTagsLoading(tagsLoadingState);
    if (isTagsDisabled !== disabledState) setIsTagsDisabled(disabledState);
  }, [visibility, tagsLoadingState, disabledState, isTagsVisible, isTagsLoading, isTagsDisabled]);

  useEffect(() => {
    if (setExposedVariable) {
      setExposedVariable('isVisible', isTagsVisible);
      setExposedVariable('isLoading', isTagsLoading);
      setExposedVariable('isDisabled', isTagsDisabled);
    }
  }, [setExposedVariable, isTagsVisible, isTagsLoading, isTagsDisabled]);

  // Follow the exact same pattern as Tabs: use tagItems for static, schema/data for dynamic
  let tagsData;
  if (!advanced) {
    // In static mode, use tagItems (same as tabs uses tabItems)
    tagsData = options;
  } else {
    // In dynamic mode, prefer data over schema (data seems to be the primary source)
    if (Array.isArray(data) && data.length > 0) {
      tagsData = data;
    } else if (Array.isArray(schema) && schema.length > 0) {
      tagsData = schema;
    } else {
      tagsData = data || schema || [];
    }
  }

  // Resolve dynamic values - similar to tabs resolveWidgetFieldValue for dynamic mode
  if (advanced && typeof tagsData === 'string') {
    tagsData = resolveWidgetFieldValue(tagsData);
  }

  // Filter visible tags and ensure proper structure - same as tabs filtering
  let parsedTags = tagsData;
  if (Array.isArray(parsedTags)) {
    parsedTags = parsedTags
      ?.filter((tag) => {
        // For dynamic data: visible is undefined or true (default to visible)
        // For static data: visible.value should be checked
        const isVisible = tag?.visible?.value !== undefined ? tag.visible.value : tag?.visible !== false;
        return isVisible;
      })
      ?.map((tag, index) => ({
        ...tag,
        id: tag.id ? tag.id : index,
      }));
  }

  console.log({
    advanced,
    schema,
    data,
    options,
    tagsData,
    parsedTags,
    schemaLength: Array.isArray(schema) ? schema.length : 'not array',
    dataLength: Array.isArray(data) ? data.length : 'not array',
    optionsLength: Array.isArray(options) ? options.length : 'not array',
  });

  const computedStyles = {
    width,
    height,
    display: isTagsVisible ? '' : 'none',
    boxShadow,
    textAlign: alignment || 'left',
    opacity: isTagsDisabled ? 0.5 : 1,
    pointerEvents: isTagsDisabled ? 'none' : 'auto',
    // Handle overflow behavior
    ...(overflow === 'wrap'
      ? {
          // Wrap tags within available width
          display: 'flex',
          flexWrap: 'wrap',
          overflowY: 'auto',
          overflowX: 'hidden',
        }
      : {
          // Horizontal scroll (default behavior)
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
        }),
  };

  function getTagIcon(tag) {
    const iconName = tag?.icon?.value || tag?.icon;
    const iconVisible = tag?.visible !== undefined ? tag.visible : false;
    console.log({ iconVisible });

    if (!iconName || !iconVisible) return null;

    // eslint-disable-next-line import/namespace
    const IconElement = Icons[iconName] === undefined ? Icons['IconHome2'] : Icons[iconName];

    return (
      <IconElement
        style={{
          width: '16px',
          height: '16px',
          marginRight: '6px',
        }}
        stroke={1.5}
      />
    );
  }

  function renderTag(item, index) {
    // Handle both 'color' and 'backgroundColor' properties for different data structures
    const backgroundColor =
      item.fieldBackgroundColor?.value || item.backgroundColor?.value || item.backgroundColor || item.color;

    // Check if individual tag is visible - handle both simple and complex structures
    // For simple structure: item.visible (boolean)
    // For complex structure: item.visible.value (boolean)
    const isTagVisible = item.visible?.value !== undefined ? item.visible.value : item.visible !== false;
    console.log({ isTagVisible, item });
    if (!isTagVisible) return null;

    // Component-level states (apply to all tags)
    const isComponentDisabled = isTagsDisabled;
    const isComponentLoading = isTagsLoading;

    // Handle textColor for both structures
    const textColor = item.textColor?.value || item.textColor;

    // Size-based styling
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
        // Default/medium size
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
      // Ensure tags don't shrink in horizontal scroll mode
      flexShrink: overflow === 'wrap' ? 1 : 0,
      // Add margin for spacing between tags (3px gap)
      margin: '0 3px 3px 0',
      // Apply border radius from styles
      borderRadius: borderRadius + 'px' || '0.25rem',
      // Apply size-based styles
      ...sizeStyles,
      // Ensure proper box-sizing
      boxSizing: 'border-box',
      // Ensure minimum dimensions
      minHeight: sizeStyles.height,
    };

    // Show spinner for global component loading
    if (isComponentLoading) {
      return (
        <span className="badge" style={tagComputedStyles} key={index}>
          <Spinner size="sm" />
          <span style={{ marginLeft: '4px' }}>{getSafeRenderableValue(item.title)}</span>
        </span>
      );
    }

    return (
      <span className="badge" style={tagComputedStyles} key={index}>
        {getTagIcon(item)}
        {getSafeRenderableValue(item.title)}
      </span>
    );
  }

  return (
    <div className="tag-comp-wrapper" style={computedStyles} data-cy={dataCy}>
      {parsedTags &&
        Array.isArray(parsedTags) &&
        parsedTags.map((item, index) => {
          return renderTag(item, index);
        })}
    </div>
  );
};
