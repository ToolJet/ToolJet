import React from 'react';
import { components } from 'react-select';
import cx from 'classnames';
import Loader from '@/ToolJetUI/Loader/Loader';
import { CornerDownLeft } from 'lucide-react';

const { MenuList } = components;

const EditableTagsMenuList = ({
  children,
  selectProps,
  allowNewTags,
  inputValue,
  optionsLoadingState,
  darkMode,
  allOptions = [],
  ...props
}) => {
  // Use default neutral colors for dropdown "add" preview (not tagBackgroundColor)
  const optionBackgroundColor = 'var(--surfaces-surface-03)';
  const optionTextColor = 'var(--text-primary)';
  const menuId = selectProps?.menuId;
  const hasChildren = React.Children.count(children) > 0;
  const selectedValues = selectProps?.value || [];

  // Check if inputValue already exists in selected tags or all options (case-insensitive)
  const trimmedInput = inputValue?.trim()?.toLowerCase();
  const isAlreadyExists = trimmedInput && (
    selectedValues.some((tag) => tag.value?.toLowerCase() === trimmedInput) ||
    allOptions.some((opt) => opt.value?.toLowerCase() === trimmedInput)
  );

  // Only show create footer if value doesn't already exist
  const showCreateFooter = allowNewTags && inputValue?.trim() && !isAlreadyExists;

  // Check children for create option and regular options
  const childrenArray = React.Children.toArray(children);
  const hasCreateOption = childrenArray.some((child) => child?.props?.data?.__isNew__);
  const hasRegularOptions = childrenArray.some((child) => !child?.props?.data?.__isNew__);

  return (
    <div
      id={`editable-tags-menu-${menuId}`}
      className={cx('editable-tags-menu-list', { 'theme-dark dark-theme': darkMode })}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {!optionsLoadingState ? (
        <>
          <div
            className="editable-tags-menu-list-body"
            style={{
              maxHeight: selectProps?.maxMenuHeight || 300,
              overflowY: 'auto',
            }}
          >
            {hasRegularOptions ? (
              <MenuList {...props} selectProps={selectProps}>
                {children}
              </MenuList>
            ) : (
              <div
                className="editable-tags-no-options"
                style={{
                  padding: '8px 12px',
                  color: 'var(--text-placeholder)',
                  textAlign: 'left',
                }}
              >
                {inputValue?.trim() ? 'No results' : 'No options'}
              </div>
            )}
          </div>

          {/* Custom "add" footer - show when creating is allowed and either no creatable option or no regular options visible */}
          {showCreateFooter && (!hasCreateOption || !hasRegularOptions) && (
            <div
              className="editable-tags-create-footer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderTop: '1px solid var(--border-weak)',
                cursor: 'pointer',
                gap: '8px',
              }}
              onClick={(e) => {
                e.stopPropagation();
                selectProps?.onCreateOption?.(inputValue);
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    color: 'var(--text-placeholder)',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  add
                </span>
                <span
                  className="editable-tags-new-tag-preview"
                  style={{
                    backgroundColor: optionBackgroundColor,
                    color: optionTextColor,
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontSize: '14px',
                    lineHeight: '20px',
                    wordBreak: 'break-all',
                    minWidth: 0,
                  }}
                >
                  {inputValue}
                </span>
              </div>
              <CornerDownLeft size={14} color="var(--text-placeholder)" style={{ flexShrink: 0 }} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4" style={{ minHeight: '100px' }}>
          <Loader style={{ zIndex: 3, position: 'absolute' }} width="36" />
        </div>
      )}
    </div>
  );
};

export default EditableTagsMenuList;
