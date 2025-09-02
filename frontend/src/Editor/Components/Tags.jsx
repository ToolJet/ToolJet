import React, { useState, useEffect, useRef } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';
import { getSafeRenderableValue } from '@/Editor/Components/utils';
import * as Icons from '@tabler/icons-react';
import Spinner from '@/_ui/Spinner';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';

export const Tags = function Tags({
  width,
  height,
  properties,
  styles,
  dataCy,
  setExposedVariable,
  setExposedVariables,
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
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isVisible: visibility,
    isLoading: tagsLoadingState,
    isDisabled: disabledState,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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

  useBatchedUpdateEffectArray([
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
        updateExposedVariablesState('isVisible', visibility);
      },
    },
    {
      dep: tagsLoadingState,
      sideEffect: () => {
        setExposedVariable('isLoading', tagsLoadingState);
        updateExposedVariablesState('isLoading', tagsLoadingState);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable('isDisabled', disabledState);
        updateExposedVariablesState('isDisabled', disabledState);
      },
    },
    {
      dep: JSON.stringify(parsedTags ?? []),
      sideEffect: () => {
        const _tags = parsedTags?.map(({ title, id }) => ({ title, id })) || [];
        setExposedVariable('tags', _tags);
      },
    },
  ]);

  useEffect(() => {
    const _tags = parsedTags?.map(({ title, id }) => ({ title, id })) || [];
    const exposedVariables = {
      tags: _tags,
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        updateExposedVariablesState('isVisible', !!value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        updateExposedVariablesState('isLoading', !!value);
      },
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
        updateExposedVariablesState('isDisabled', !!value);
      },
      isVisible: visibility,
      isLoading: tagsLoadingState,
      isDisabled: disabledState,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedStyles = {
    width,
    height,
    display: exposedVariablesTemporaryState.isVisible ? '' : 'none',
    boxShadow,
    textAlign: alignment || 'left',
    opacity: exposedVariablesTemporaryState.isDisabled ? 0.5 : 1,
    pointerEvents: exposedVariablesTemporaryState.isDisabled ? 'none' : 'auto',
    ...(overflow === 'wrap'
      ? {
          display: 'flex',
          flexWrap: 'wrap',
          overflowY: 'auto',
          overflowX: 'hidden',
          justifyContent: 'flex-start',
          alignContent: 'flex-start',
          alignItems: 'flex-start',
          margin: '0 -3px -3px 0',
        }
      : {
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          overflowY: 'hidden',
          whiteSpace: 'nowrap',
        }),
  };

  function getTagIcon(tag) {
    const iconName = tag?.icon?.value || tag?.icon;
    const iconVisible =
      tag?.iconVisibility?.value !== undefined
        ? tag.iconVisibility.value
        : tag?.iconVisibility !== undefined
        ? tag.iconVisibility
        : false;

    if (!iconName || !iconVisible) return null;

    // eslint-disable-next-line import/namespace
    const IconElement = Icons[iconName] === undefined ? Icons['IconHome2'] : Icons[iconName];

    return (
      <IconElement
        style={{
          width: size === 'small' ? '12px' : '16px',
          height: size === 'small' ? '12px' : '16px',
          marginRight: '4px',
        }}
        stroke={1.5}
      />
    );
  }

  function renderTag(item, index) {
    const backgroundColor = item.backgroundColor || item.color;

    const isTagVisible = item.visible?.value !== undefined ? item.visible.value : item.visible !== false;
    if (!isTagVisible) return null;

    const isComponentDisabled = exposedVariablesTemporaryState.isDisabled;

    const textColor = item.textColor;

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
      ...sizeStyles,
      boxSizing: 'border-box',
      minHeight: sizeStyles.height,
    };

    return (
      <span className="badge" style={tagComputedStyles} key={index + item.title}>
        {getTagIcon(item)}
        {getSafeRenderableValue(item.title)}
      </span>
    );
  }

  return (
    <div className="tag-comp-wrapper" style={computedStyles} data-cy={dataCy}>
      {exposedVariablesTemporaryState.isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
          <Spinner size="sm" />
        </div>
      ) : (
        parsedTags &&
        Array.isArray(parsedTags) &&
        parsedTags.map((item, index) => {
          return renderTag(item, index);
        })
      )}
    </div>
  );
};
