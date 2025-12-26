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
  const menuId = selectProps?.menuId;
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
          >
            {hasRegularOptions ? (
              <MenuList {...props} selectProps={selectProps}>
                {children}
              </MenuList>
            ) : (
              <div className="editable-tags-no-options">
                {inputValue?.trim() ? 'No results' : 'No options'}
              </div>
            )}
          </div>

          {/* Custom "add" footer - show when creating is allowed and either no creatable option or no regular options visible */}
          {showCreateFooter && (!hasCreateOption || !hasRegularOptions) && (
            <div
              className="editable-tags-create-footer"
              onClick={(e) => {
                e.stopPropagation();
                selectProps?.onCreateOption?.(inputValue);
              }}
            >
              <div className="editable-tags-new-tag-preview">
                <span
                 className='add-text'
                >
                  add
                </span>
                <span
                  className="editable-tags-new-tag-preview-text"
                >
                  {inputValue}
                </span>
              </div>
              <CornerDownLeft size={14} color="var(--text-placeholder)" style={{ flexShrink: 0 }} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-4">
          <Loader style={{ zIndex: 3, position: 'absolute' }} width="36" />
        </div>
      )}
    </div>
  );
};

export default EditableTagsMenuList;
