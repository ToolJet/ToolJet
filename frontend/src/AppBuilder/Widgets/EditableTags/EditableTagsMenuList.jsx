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
  ...props
}) => {
  // Use default neutral colors for dropdown "add" preview (not tagBackgroundColor)
  const optionBackgroundColor = 'var(--surfaces-surface-03)';
  const optionTextColor = 'var(--text-primary)';
  const menuId = selectProps?.menuId;
  const hasChildren = React.Children.count(children) > 0;
  const showCreateFooter = allowNewTags && inputValue?.trim();

  // Check if the "Create" option is already shown by react-select/creatable
  const hasCreateOption = React.Children.toArray(children).some(
    (child) => child?.props?.data?.__isNew__
  );

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
            {hasChildren ? (
              <MenuList {...props} selectProps={selectProps}>
                {children}
              </MenuList>
            ) : !showCreateFooter ? (
              <div
                className="editable-tags-no-options"
                style={{
                  padding: '12px 16px',
                  color: 'var(--text-placeholder)',
                  textAlign: 'center',
                }}
              >
                No options
              </div>
            ) : null}
          </div>

          {/* Custom "add" footer - only show if not already shown via creatable */}
          {showCreateFooter && !hasCreateOption && (
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
