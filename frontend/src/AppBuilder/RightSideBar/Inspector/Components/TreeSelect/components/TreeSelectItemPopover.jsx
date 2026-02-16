import React, { forwardRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const TreeSelectItemPopover = forwardRef(
  ({ item, darkMode, onItemChange, onDeleteItem, getResolvedValue, parentValue = null, ...restProps }, ref) => {
    // Common CodeHinter props
    const commonCodeHinterProps = {
      theme: darkMode ? 'monokai' : 'default',
      mode: 'javascript',
      lineNumbers: false,
    };

    const basicCodeHinterProps = {
      ...commonCodeHinterProps,
      type: 'basic',
    };

    const handleChange = (propertyPath, value) => {
      onItemChange(propertyPath, value, item.value, parentValue);
    };

    const handleDelete = () => {
      onDeleteItem(item.value, parentValue);
    };

    return (
      <Popover
        ref={ref}
        {...restProps}
        style={{ ...restProps.style, width: '310px' }}
        className={`${darkMode ? 'dark-theme theme-dark' : ''} treeselect-item-popover ${restProps.className || ''}`}
      >
        <div
          className="treeselect-item-popover-container"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div data-cy="inspector-treeselect-item-details-header" className="treeselect-item-popover-header">
            <span data-cy="inspector-treeselect-item-details-title" className="treeselect-item-popover-header-title">
              Edit option
            </span>
            <div data-cy="inspector-treeselect-item-details-actions" className="treeselect-item-popover-header-actions">
              <ButtonComponent
                data-cy="inspector-treeselect-item-delete-button"
                isLucid={true}
                iconOnly
                onClick={handleDelete}
                title="Delete"
                trailingIcon="trash"
                variant="ghost"
                size="medium"
              />
            </div>
          </div>

          {/* Content */}
          <div data-cy="inspector-treeselect-item-details-content" className="treeselect-item-popover-content">
            {/* Label field */}
            <div className="treeselect-item-popover-fields-section">
              <div data-cy="inspector-treeselect-item-details-label-field" className="treeselect-item-popover-field">
                <label
                  data-cy="inspector-treeselect-item-details-label-label"
                  className="treeselect-item-popover-field-label"
                >
                  Label
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-treeselect-item-details-label-input"
                  initialValue={item?.label || ''}
                  onChange={(value) => handleChange('label', value)}
                />
              </div>

              {/* Value field */}
              <div data-cy="inspector-treeselect-item-details-value-field" className="treeselect-item-popover-field">
                <label
                  data-cy="inspector-treeselect-item-details-value-label"
                  className="treeselect-item-popover-field-label"
                >
                  Value
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-treeselect-item-details-value-input"
                  initialValue={item?.value || ''}
                  onChange={(value) => handleChange('value', value)}
                />
              </div>
            </div>
          </div>
        </div>
      </Popover>
    );
  }
);

TreeSelectItemPopover.displayName = 'TreeSelectItemPopover';

export default TreeSelectItemPopover;
