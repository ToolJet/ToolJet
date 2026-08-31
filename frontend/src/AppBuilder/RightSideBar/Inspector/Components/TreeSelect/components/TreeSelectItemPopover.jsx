import React, { forwardRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const TreeSelectItemPopover = forwardRef(
  (
    {
      item,
      darkMode,
      onItemChange,
      onDeleteItem,
      getResolvedValue,
      parentValue = null,
      showSelectionFields = true,
      componentId,
      ...restProps
    },
    ref
  ) => {
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
      onItemChange(propertyPath, value, item.value, parentValue);
    };
    const handleDelete = () => {
      onDeleteItem(item.value, parentValue);
    };

    // Instance-scoped: TreeSelect and Cascader instances sharing an item value must not share a
    // stash entry.
    const getFxStashKey = (property) =>
      componentId && `${componentId}-treeItems-${parentValue ?? 'root'}-${item.value}-${property}`;

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
                trailingIcon="trash-2"
                variant="ghost"
                size="medium"
              />
            </div>
          </div>

          {/* Content */}
          <div data-cy="inspector-treeselect-item-details-content" className="treeselect-item-popover-content">
            {/* Label & Value fields */}
            <div data-cy="inspector-treeselect-item-details-label-field" className="treeselect-item-popover-field">
              <label
                data-cy="inspector-treeselect-item-details-label-label"
                className="treeselect-item-popover-field-label"
              >
                Option label
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
                Option value
              </label>
              <CodeHinter
                {...basicCodeHinterProps}
                data-cy="inspector-treeselect-item-details-value-input"
                initialValue={item?.value || ''}
                onChange={(value) => handleChange('value', value)}
              />
            </div>

            {showSelectionFields && (
              <>
                <div
                  data-cy="inspector-treeselect-item-details-selected-field"
                  className="treeselect-item-popover-field"
                >
                  <CodeHinter
                    {...fxEditorCodeHinterProps}
                    data-cy="inspector-treeselect-item-details-selected-input"
                    initialValue={item?.selected?.value}
                    paramLabel={'Selected'}
                    paramName={'selected'}
                    onChange={(value) => handleChange('selected.value', value)}
                    onFxToggle={(active, newValue) =>
                      handleChange('selected', {
                        ...item?.selected,
                        fxActive: active,
                        ...(newValue !== undefined && { value: newValue }),
                      })
                    }
                    fxStashKey={getFxStashKey('selected')}
                    fxActive={item?.selected?.fxActive}
                    fieldMeta={{ type: 'toggle', displayName: 'Selected' }}
                    paramType={'toggle'}
                  />
                </div>

                <div
                  data-cy="inspector-treeselect-item-details-expanded-field"
                  className="treeselect-item-popover-field"
                >
                  <CodeHinter
                    {...fxEditorCodeHinterProps}
                    data-cy="inspector-treeselect-item-details-expanded-input"
                    initialValue={item?.expanded?.value}
                    paramLabel={'Expanded'}
                    paramName={'expanded'}
                    onChange={(value) => handleChange('expanded.value', value)}
                    onFxToggle={(active, newValue) =>
                      handleChange('expanded', {
                        ...item?.expanded,
                        fxActive: active,
                        ...(newValue !== undefined && { value: newValue }),
                      })
                    }
                    fxStashKey={getFxStashKey('expanded')}
                    fxActive={item?.expanded?.fxActive}
                    fieldMeta={{ type: 'toggle', displayName: 'Expanded' }}
                    paramType={'toggle'}
                  />
                </div>
              </>
            )}

            {/* Toggle fields section */}
            <div data-cy="inspector-treeselect-item-details-visible-field" className="treeselect-item-popover-field">
              <CodeHinter
                {...fxEditorCodeHinterProps}
                data-cy="inspector-treeselect-item-details-visible-input"
                initialValue={item?.visible?.value}
                paramLabel={'Visibility'}
                paramName={'visible'}
                onChange={(value) => handleChange('visible.value', value)}
                onFxToggle={(active, newValue) =>
                  handleChange('visible', {
                    ...item?.visible,
                    fxActive: active,
                    ...(newValue !== undefined && { value: newValue }),
                  })
                }
                fxStashKey={getFxStashKey('visible')}
                fxActive={item?.visible?.fxActive}
                fieldMeta={{ type: 'toggle', displayName: 'Visibility' }}
                paramType={'toggle'}
              />
            </div>

            <div data-cy="inspector-treeselect-item-details-disable-field" className="treeselect-item-popover-field">
              <CodeHinter
                {...fxEditorCodeHinterProps}
                data-cy="inspector-treeselect-item-details-disable-input"
                initialValue={item?.disable?.value}
                paramLabel={'Disable'}
                paramName={'disable'}
                onChange={(value) => handleChange('disable.value', value)}
                onFxToggle={(active, newValue) =>
                  handleChange('disable', {
                    ...item?.disable,
                    fxActive: active,
                    ...(newValue !== undefined && { value: newValue }),
                  })
                }
                fxStashKey={getFxStashKey('disable')}
                fxActive={item?.disable?.fxActive}
                fieldMeta={{ type: 'toggle', displayName: 'Disable' }}
                paramType={'toggle'}
              />
            </div>
          </div>
        </div>
      </Popover>
    );
  }
);

export default TreeSelectItemPopover;
