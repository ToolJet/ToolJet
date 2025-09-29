import React, { forwardRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const OptionDetailsPopover = forwardRef(
  ({ item, index, darkMode, onOptionChange, onDeleteOption, getResolvedValue, ...restProps }, ref) => {
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

    return (
      <Popover
        ref={ref}
        {...restProps}
        style={{ ...restProps.style, minWidth: '248px' }}
        className={`${darkMode && 'dark-theme theme-dark'} pm-option-popover ${restProps.className}`}
      >
        <Popover.Body>
          <div data-cy="inspector-popover-menu-option-details-container">
            <div data-cy="inspector-popover-menu-option-details-header" className="pm-option-header">
              <span data-cy="inspector-popover-menu-option-details-title" className="pm-option-header-title">
                Option details
              </span>
              <div data-cy="inspector-popover-menu-option-details-actions" className="pm-option-details-actions">
                <ButtonComponent
                  data-cy="inspector-popover-menu-option-details-delete-button"
                  variant="ghost"
                  iconOnly
                  onClick={() => onDeleteOption(index)}
                  trailingIcon="trash"
                  size="medium"
                />
              </div>
            </div>
            <div data-cy="inspector-popover-menu-option-details-fields" className="pm-option-details">
              <div data-cy="inspector-popover-menu-option-details-format-field" className="field mb-2">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-format-input"
                  initialValue={item?.format || 'plain'}
                  paramLabel={'Data format'}
                  paramName={'dataFormat'}
                  onChange={(value) => {
                    onOptionChange('format', value, index);
                  }}
                  fieldMeta={{
                    type: 'select',
                    displayName: 'Data format',
                    options: [
                      { name: 'Plain', value: 'plain' },
                      { name: 'HTML', value: 'html' },
                      { name: 'Markdown', value: 'markdown' },
                    ],
                    isFxNotRequired: true,
                  }}
                  paramType={'select'}
                />
              </div>

              <div data-cy="inspector-popover-menu-option-details-label-field" className="field mb-2">
                <label
                  data-cy="inspector-popover-menu-option-details-label-label"
                  className="font-weight-500 mb-1 font-size-12"
                >
                  Label
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-label-input"
                  initialValue={item?.label}
                  onChange={(value) => {
                    onOptionChange('label', value, index);
                  }}
                />
              </div>
              <div data-cy="inspector-popover-menu-option-details-description-field" className="field mb-2">
                <label
                  data-cy="inspector-popover-menu-option-details-description-label"
                  className="font-weight-500 mb-1 font-size-12"
                >
                  Description
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-description-input"
                  initialValue={item?.description}
                  onChange={(value) => {
                    onOptionChange('description', value, index);
                  }}
                />
              </div>
              <div data-cy="inspector-popover-menu-option-details-value-field" className="field mb-2">
                <label
                  data-cy="inspector-popover-menu-option-details-value-label"
                  className="font-weight-500 mb-1 font-size-12"
                >
                  Value
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-value-input"
                  initialValue={item?.value}
                  onChange={(value) => {
                    onOptionChange('value', value, index);
                  }}
                />
              </div>
              <div data-cy="inspector-popover-menu-option-details-icon-field" className="field mb-3">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-icon-input"
                  initialValue={item?.icon?.value || ''}
                  paramLabel={'Icon'}
                  paramName={'icon'}
                  onChange={(value) => {
                    onOptionChange('icon.value', value, index);
                  }}
                  onVisibilityChange={(value) => {
                    const transformedValue = getResolvedValue(value);
                    onOptionChange('iconVisibility', transformedValue, index);
                  }}
                  onFxPress={(active) => onOptionChange('icon.fxActive', active, index)}
                  fxActive={item?.icon?.fxActive}
                  fieldMeta={{ type: 'icon', displayName: 'Icon' }}
                  paramType={'icon'}
                  iconVisibility={iconVisibility}
                />
              </div>
              <div data-cy="inspector-popover-menu-option-details-visibility-field" className="field mb-2">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-visibility-input"
                  initialValue={item?.visible?.value}
                  paramLabel={'Option visibility'}
                  paramName={'optionVisibility'}
                  onChange={(value) => {
                    onOptionChange('visible.value', value, index);
                  }}
                  onFxPress={(active) => onOptionChange('visible.fxActive', active, index)}
                  fxActive={item?.visible?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Option visibility' }}
                  paramType={'toggle'}
                />
              </div>
              <div data-cy="inspector-popover-menu-option-details-disable-field" className="field mb-2">
                <CodeHinter
                  {...fxEditorCodeHinterProps}
                  data-cy="inspector-popover-menu-option-details-disable-input"
                  initialValue={item?.disable?.value}
                  paramLabel={'Disable option'}
                  paramName={'optionDisabled'}
                  onChange={(value) => {
                    onOptionChange('disable.value', value, index);
                  }}
                  onFxPress={(active) => onOptionChange('disable.fxActive', active, index)}
                  fxActive={item?.disable?.fxActive}
                  fieldMeta={{ type: 'toggle', displayName: 'Disable option' }}
                  paramType={'toggle'}
                />
              </div>
            </div>
          </div>
        </Popover.Body>
      </Popover>
    );
  }
);

export default OptionDetailsPopover;
