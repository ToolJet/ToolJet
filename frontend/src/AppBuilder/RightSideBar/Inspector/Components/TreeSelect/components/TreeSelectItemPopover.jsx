import React, { forwardRef, useMemo, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';

const TreeSelectItemPopover = forwardRef(
  (
    {
      item,
      darkMode,
      onItemChange,
      validateItemField,
      onDeleteItem,
      getResolvedValue,
      parentValue = null,
      showSelectionFields = true,
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

    // Text being typed per field; the message under the field follows it before anything is saved.
    const [draft, setDraft] = useState({});
    const [resetKey, setResetKey] = useState({ label: 0, value: 0 });

    const fieldError = (propertyPath) => {
      if (draft[propertyPath] === undefined || !validateItemField) return null;
      const [isValid, message] = validateItemField(propertyPath, draft[propertyPath], item.value);
      return isValid ? null : message;
    };

    // Stable identity: the code editor resets an in-progress edit whenever validationFn changes.
    const [validateLabel, validateValue] = useMemo(
      () =>
        ['label', 'value'].map(
          (propertyPath) => (value) => validateItemField?.(propertyPath, value, item.value) ?? [true, null]
        ),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [item.value]
    );

    const handleChange = (propertyPath, value) => {
      const accepted = onItemChange(propertyPath, value, item.value, parentValue);
      if (propertyPath === 'label' || propertyPath === 'value') {
        setDraft((prev) => ({ ...prev, [propertyPath]: undefined }));
        // A refused edit remounts the field so it shows the stored value again, as Steps and Tabs do.
        if (accepted === false) setResetKey((prev) => ({ ...prev, [propertyPath]: prev[propertyPath] + 1 }));
      }
    };

    const renderFieldError = (propertyPath) => {
      const message = fieldError(propertyPath);
      return message ? (
        <div
          className="tw-text-text-danger tw-mt-1"
          data-cy={`inspector-treeselect-item-details-${propertyPath}-error`}
        >
          {message}
        </div>
      ) : null;
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
                key={`label-${resetKey.label}`}
                data-cy="inspector-treeselect-item-details-label-input"
                initialValue={item?.label || ''}
                onChange={(value) => handleChange('label', value)}
                onInputChange={(value) => setDraft((prev) => ({ ...prev, label: value }))}
                validationFn={validateLabel}
              />
              {renderFieldError('label')}
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
                key={`value-${resetKey.value}`}
                data-cy="inspector-treeselect-item-details-value-input"
                initialValue={item?.value || ''}
                onChange={(value) => handleChange('value', value)}
                onInputChange={(value) => setDraft((prev) => ({ ...prev, value }))}
                validationFn={validateValue}
              />
              {renderFieldError('value')}
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
                    onFxPress={(active) => handleChange('selected.fxActive', active)}
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
                    onFxPress={(active) => handleChange('expanded.fxActive', active)}
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
                onFxPress={(active) => handleChange('visible.fxActive', active)}
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
                onFxPress={(active) => handleChange('disable.fxActive', active)}
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
