import React, { useRef, useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import { IconX } from '@tabler/icons-react';
import cx from 'classnames';
import { shallow } from 'zustand/shallow';

import useStore from '@/AppBuilder/_stores/store';
import { isExpectedDataType } from '@/_helpers/utils.js';
import Label from '@/_ui/Label';
import Loader from '@/ToolJetUI/Loader/Loader';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';
import { getInputBackgroundColor, getInputBorderColor } from '@/AppBuilder/Widgets/DropdownV2/utils';
import {
  getLabelFontSize,
  getLabelWidthOfInput,
  getWidthTypeOfComponentStyles,
} from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { useEditorStore } from '@/_stores/editorStore';
import type { CascaderMenuRef, CascaderValidationStatus, CascaderValue } from './types';
import { normalizeTree, findDefaultValue } from './utils';
import { useCascader } from './useCascader';
import CascaderMenu from './CascaderMenu';
import './cascader.scss';

const LabelComponent = Label as React.ComponentType<any>;
const LoaderComponent = Loader as React.ComponentType<any>;
const TablerIconComponent = TablerIcon as React.ComponentType<any>;

interface CascaderProps {
  height: number;
  validate?: (value: CascaderValue | null) => CascaderValidationStatus;
  properties: Record<string, any>;
  styles: Record<string, any>;
  setExposedVariable: (key: string, value: unknown) => void;
  setExposedVariables: (variables: unknown) => void;
  fireEvent: (eventName: string) => void;
  darkMode?: boolean;
  onComponentClick?: (id: string) => void;
  id: string;
  componentName?: string;
  validation?: {
    mandatory?: boolean;
  };
  dataCy?: string;
}

export const Cascader = ({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  componentName: _componentName,
  validation,
  dataCy,
}: CascaderProps) => {
  const {
    label,
    placeholder,
    advanced,
    value: selectedValueProp,
    pathSeparator,
    optionsLoadingState,
    loadingState,
    disabledState,
    visibility,
    showClearBtn,
  } = properties;
  const {
    selectedTextColor,
    fieldBorderRadius,
    boxShadow,
    labelColor,
    alignment,
    direction,
    fieldBorderColor,
    fieldBackgroundColor,
    placeholderTextColor,
    labelWidth,
    icon,
    iconVisibility,
    iconColor,
    errTextColor,
    accentColor,
    auto: labelAutoWidth,
    padding,
    widthType,
    menuWidthMode,
    menuCustomWidth,
    labelFontSize,
  } = styles;

  const getResolvedValue = useStore((state: any) => state.getResolvedValue, shallow);

  // Resolve the option source per the static/dynamic pattern, then normalize.
  const rawSource = !advanced
    ? properties.options
    : isExpectedDataType(properties.data, 'array')
    ? properties.data
    : [];
  const tree = normalizeTree(rawSource, getResolvedValue);
  const shouldShowOptionsLoading = Boolean(advanced && optionsLoadingState);

  // Static options: use the explicit "Selected value" property.
  // Dynamic options: derive the selected value from the `default: true` leaf in the schema.
  const defaultValue = advanced ? findDefaultValue(rawSource, getResolvedValue) : selectedValueProp;

  const {
    maps,
    selectedValue,
    selection,
    isVisible,
    isDisabled,
    isLoading,
    isOptionsLoading,
    isValid,
    validationError,
    isMandatory,
    showValidationError,
    setShowValidationError,
    selectLeafFromUI,
    clearFromUI,
  } = useCascader({
    tree,
    pathSeparator,
    defaultValue,
    label,
    visibility,
    disabledState,
    loadingState,
    optionsLoadingState: shouldShowOptionsLoading,
    setExposedVariable,
    setExposedVariables,
    fireEvent,
    validate,
    validation,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const controlRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef(false);
  const menuRef = useRef<CascaderMenuRef | null>(null);

  const interactionBlocked = isDisabled || isLoading;
  const hasValue = selection.value !== null && selection.value !== undefined;
  const showSelectedPath = hasValue && !isOptionsLoading;
  const showClear = showClearBtn && hasValue && !interactionBlocked;

  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const _width = getLabelWidthOfInput(widthType, labelWidth);
  const labelFontSizeValue = getLabelFontSize(labelFontSize);
  const isTopAlignment = alignment === 'top';

  const borderColor = getInputBorderColor({
    isFocused,
    isValid,
    fieldBorderColor,
    accentColor,
    isLoading,
    isDisabled,
    userInteracted: showValidationError,
  });
  const backgroundColor = getInputBackgroundColor({ fieldBackgroundColor });
  const textColor =
    selectedTextColor !== '#1B1F24'
      ? selectedTextColor
      : interactionBlocked
      ? 'var(--text-disabled)'
      : 'var(--text-primary)';

  const menuWidthStyle =
    menuWidthMode === 'custom'
      ? `${parseFloat(menuCustomWidth) || 256}px`
      : menuWidthMode === 'matchContent'
      ? 'auto'
      : 'var(--radix-popover-trigger-width)';
  const shouldOverridePlaceholderTextColor =
    typeof placeholderTextColor === 'string' &&
    placeholderTextColor.length > 0 &&
    placeholderTextColor !== 'var(--cc-placeholder-text)';
  const shouldUsePlaceholderTextColorForIcon =
    shouldOverridePlaceholderTextColor &&
    (!iconColor || iconColor === 'var(--cc-default-icon)' || iconColor === '#CFD3D859');
  const computedIconColor = shouldUsePlaceholderTextColorForIcon ? placeholderTextColor : iconColor;

  const openInteraction = () => {
    if (interactionBlocked) return;

    controlRef.current?.focus();
    setIsFocused(true);
    setIsOpen(true);

    if (isInteractingRef.current) return;
    isInteractingRef.current = true;
    fireEvent('onFocus');
  };

  const closeInteraction = () => {
    if (!isOpen && !isInteractingRef.current) return;

    setIsOpen(false);
    setIsFocused(false);
    setShowValidationError(true);

    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    fireEvent('onBlur');
  };

  const closeAfterSelection = () => {
    setIsOpen(false);
    setShowValidationError(true);
    isInteractingRef.current = false;
  };

  const toggleOpen = () => {
    if (interactionBlocked) return;
    if (isOpen) closeInteraction();
    else openInteraction();
  };

  const handleSelectLeaf = (value: CascaderValue) => {
    selectLeafFromUI(value);
    closeAfterSelection();
  };

  const handleClear = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    clearFromUI();
    setShowValidationError(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (interactionBlocked) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openInteraction();
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeInteraction();
      return;
    }
    menuRef.current?.handleKeyDown?.(e);
  };

  return (
    <>
      <div
        className={cx('cascader-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : 'align-items-center']: true,
          'flex-row-reverse': direction === 'right' && alignment === 'side',
          'text-right': direction === 'right' && alignment === 'top',
          invisible: !isVisible,
        })}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
          height: '100%',
          visibility: isVisible ? 'visible' : 'hidden',
        }}
        onMouseDown={() => {
          onComponentClick?.(id);
          useEditorStore.getState().actions.setHoveredComponent('');
        }}
      >
        <LabelComponent
          dataCy={dataCy}
          label={label}
          width={labelWidth}
          darkMode={darkMode}
          color={labelColor}
          defaultAlignment={alignment}
          direction={direction}
          auto={labelAutoWidth}
          isMandatory={isMandatory}
          _width={_width}
          widthType={widthType}
          id={`${id}-label`}
          inputId={`component-${id}`}
          fontSize={labelFontSizeValue}
        />
        <div
          className="cascader-actionable-section"
          data-cy={`${String(dataCy).toLowerCase()}-actionable-section`}
          style={{
            ...getWidthTypeOfComponentStyles(widthType, labelWidth, labelAutoWidth, alignment),
          }}
        >
          <Popover.Root
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) closeInteraction();
            }}
          >
            <Popover.Anchor asChild>
              <div
                ref={controlRef}
                id={`component-${id}`}
                role="combobox"
                aria-expanded={isOpen}
                aria-disabled={isDisabled}
                aria-invalid={!isValid}
                aria-required={isMandatory}
                tabIndex={interactionBlocked ? -1 : 0}
                className={cx('cascader-control', { 'is-disabled': interactionBlocked })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  height: isTopAlignment ? '100%' : _height,
                  minHeight: _height,
                  padding: '0 10px',
                  borderRadius: Number.parseFloat(fieldBorderRadius),
                  border: `1px solid ${borderColor}`,
                  backgroundColor,
                  boxShadow,
                  cursor: interactionBlocked ? 'not-allowed' : 'pointer',
                }}
                onClick={toggleOpen}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              >
                {iconVisibility && (
                  <TablerIconComponent
                    iconName={icon}
                    style={{
                      width: '16px',
                      height: '16px',
                      color: computedIconColor,
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  className="cascader-display"
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '14px',
                    color: showSelectedPath ? textColor : placeholderTextColor || 'var(--cc-placeholder-text)',
                  }}
                >
                  {isOptionsLoading ? '' : showSelectedPath ? selection.pathString : placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                  {showClear && (
                    <span
                      className="cascader-clear"
                      data-cy="cascader-clear"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleClear}
                      style={{ display: 'inline-flex', cursor: 'pointer' }}
                    >
                      <IconX size={16} color="var(--borders-strong)" />
                    </span>
                  )}
                  {isLoading ? (
                    <LoaderComponent width="16" absolute={false} />
                  ) : isOpen ? (
                    <TriangleUpArrow width={'18'} fill={'var(--borders-strong)'} />
                  ) : (
                    <TriangleDownArrow width={'18'} fill={'var(--borders-strong)'} />
                  )}
                </div>
              </div>
            </Popover.Anchor>
            <Popover.Portal>
              <Popover.Content
                side="bottom"
                align="start"
                sideOffset={5}
                className={cx('PopoverContent', 'cascader-popover', { 'dark-theme': darkMode })}
                onOpenAutoFocus={(e) => e.preventDefault()}
                onCloseAutoFocus={(e) => e.preventDefault()}
                style={{
                  width: menuWidthStyle,
                  minWidth: 'var(--radix-popover-trigger-width)',
                  maxWidth: '420px',
                  padding: 0,
                  backgroundColor: 'var(--cc-surface1-surface)',
                  border: '1px solid var(--cc-weak-border, #e4e7eb)',
                  borderRadius: '8px',
                  boxShadow: '0px 0px 1px 0px rgba(48,50,51,0.05), 0px 8px 16px 0px rgba(48,50,51,0.1)',
                  overflow: 'hidden',
                  zIndex: 1040,
                }}
              >
                <CascaderMenu
                  ref={menuRef}
                  tree={tree}
                  maps={maps}
                  selectedValue={selectedValue}
                  optionsLoading={isOptionsLoading}
                  onSelectLeaf={handleSelectLeaf}
                  menuTextColor={selectedTextColor !== '#1B1F24' ? selectedTextColor : 'var(--cc-primary-text)'}
                  accentColor={accentColor}
                />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>
      {showValidationError && isVisible && !isValid && (
        <div
          className="d-flex"
          style={{
            color: errTextColor,
            justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
            fontSize: '11px',
            fontWeight: '400',
            lineHeight: '16px',
          }}
        >
          {validationError}
        </div>
      )}
    </>
  );
};

export default Cascader;
