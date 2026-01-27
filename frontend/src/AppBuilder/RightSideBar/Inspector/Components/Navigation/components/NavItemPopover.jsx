import React, { forwardRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const NavItemPopover = forwardRef(
  ({ item, darkMode, onItemChange, onDeleteItem, onDuplicateItem, getResolvedValue, parentId = null, ...restProps }, ref) => {
    const iconVisibility = item?.iconVisibility;

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

    const fxEditorCodeHinterProps = {
      ...commonCodeHinterProps,
      type: 'fxEditor',
    };

    const handleChange = (propertyPath, value) => {
      onItemChange(propertyPath, value, item.id, parentId);
    };

    const handleDelete = () => {
      onDeleteItem(item.id, parentId);
    };

    const handleDuplicate = () => {
      onDuplicateItem?.(item.id, parentId);
    };

    return (
      <Popover
        ref={ref}
        {...restProps}
        style={{ ...restProps.style, width: '310px' }}
        className={`${darkMode && 'dark-theme theme-dark'} nav-item-popover ${restProps.className || ''}`}
      >
        <div
          className="nav-item-popover-container"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div data-cy="inspector-nav-item-details-header" className="nav-item-popover-header">
            <span data-cy="inspector-nav-item-details-title" className="nav-item-popover-header-title">
              {item.isGroup ? 'Edit group' : 'Edit menu item'}
            </span>
            <div data-cy="inspector-nav-item-details-actions" className="nav-item-popover-header-actions">
              {onDuplicateItem && (
                <ButtonComponent
                  data-cy="inspector-nav-item-duplicate-button"
                  isLucid={true}
                  iconOnly
                  onClick={handleDuplicate}
                  title="Duplicate"
                  trailingIcon="copy"
                  variant="ghost"
                  size="medium"
                />
              )}
              <ButtonComponent
                data-cy="inspector-nav-item-delete-button"
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
          <div data-cy="inspector-nav-item-details-content" className="nav-item-popover-content">
            {/* Fields section */}
            <div className="nav-item-popover-fields-section">
              {/* Label field */}
              <div data-cy="inspector-nav-item-details-label-field" className="nav-item-popover-field">
                <label
                  data-cy="inspector-nav-item-details-label-label"
                  className="nav-item-popover-field-label"
                >
                  Label
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-nav-item-details-label-input"
                  initialValue={item?.label}
                  onChange={(value) => handleChange('label', value)}
                />
              </div>

              {/* Icon field */}
              <div data-cy="inspector-nav-item-details-icon-field" className="nav-item-popover-field">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-nav-item-details-icon-input"
                  initialValue={item?.icon?.value || ''}
                  paramLabel={'Icon'}
                  paramName={'icon'}
                  onChange={(value) => handleChange('icon.value', value)}
                  onVisibilityChange={(value) => {
                    const transformedValue = getResolvedValue(value);
                    handleChange('iconVisibility', transformedValue);
                  }}
                  onFxPress={(active) => handleChange('icon.fxActive', active)}
                  fxActive={item?.icon?.fxActive}
                  fieldMeta={{ type: 'icon', displayName: 'Icon' }}
                  paramType={'icon'}
                  iconVisibility={iconVisibility}
                />
              </div>
            </div>

            {/* Toggle fields section */}
            <div className="nav-item-popover-toggles-section">
              <div data-cy="inspector-nav-item-details-visibility-field" className="nav-item-popover-field">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-nav-item-details-visibility-input"
                  initialValue={item?.visible?.value}
                  paramLabel={'Hide this item'}
                  paramName={'visibility'}
                  onChange={(value) => handleChange('visible.value', value)}
                  onFxPress={(active) => handleChange('visible.fxActive', active)}
                  fxActive={item?.visible?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Hide this item' }}
                  paramType={'toggle'}
                />
              </div>

              <div data-cy="inspector-nav-item-details-disable-field" className="nav-item-popover-field">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-nav-item-details-disable-input"
                  initialValue={item?.disable?.value}
                  paramLabel={'Disable item'}
                  paramName={'disable'}
                  onChange={(value) => handleChange('disable.value', value)}
                  onFxPress={(active) => handleChange('disable.fxActive', active)}
                  fxActive={item?.disable?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Disable item' }}
                  paramType={'toggle'}
                />
              </div>
            </div>
          </div>
        </div>
      </Popover>
    );
  }
);

NavItemPopover.displayName = 'NavItemPopover';

export default NavItemPopover;
