import React, { forwardRef, useCallback, useRef, useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';
import { EventManager } from '@/AppBuilder/RightSideBar/Inspector/EventManager';
const NAV_ITEM_EVENT_META = { name: 'Navigation', events: { onClick: { displayName: 'On click' } } };

const NavItemPopover = forwardRef(
  (
    {
      componentId,
      item,
      darkMode,
      onItemChange,
      onDeleteItem,
      onDuplicateItem,
      validateItemId,
      getResolvedValue,
      parentId = null,
      ...restProps
    },
    ref
  ) => {
    const iconVisibility = item?.iconVisibility;

    // Stable identity for the Id field's `validationFn`: it's a dependency of
    // SingleLineCodeEditor's value-reset effect, so a fresh closure on every render
    // (as an inline arrow normally would be) re-fires that effect and wipes whatever
    // the user has typed so far back to `item.id` on any unrelated re-render — not
    // just an outside click. Reading `item` via a ref keeps this callback's reference
    // stable across renders while still validating against the current id.
    const itemRef = useRef(item);
    itemRef.current = item;
    const validateIdField = useCallback((value) => validateItemId(value, itemRef.current?.id), [validateItemId]);

    // Bumped to force just the Id field to remount and re-seed from `initialValue` on a rejected collision.
    const [idFieldResetKey, setIdFieldResetKey] = useState(0);

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

    // Identify the item by its stable `_key`, not `id` — `id` is itself editable here,
    // and every field's onChange shares this same closure's `item`, so an id rename and
    // another field's change landing in the same tick must still each resolve to the
    // right item rather than one losing track once the id changes underneath it.
    const handleChange = (propertyPath, value) => {
      if (propertyPath === 'id') {
        const [isValid] = validateIdField(value);
        if (!isValid) {
          // Reject outright — letting a colliding id sit in state, even unpersisted, let two items share one.
          setIdFieldResetKey((key) => key + 1);
          return;
        }
      }
      onItemChange(propertyPath, value, item._key, parentId);
    };

    const handleDelete = () => {
      onDeleteItem(item._key, parentId);
    };

    const handleDuplicate = () => {
      onDuplicateItem?.(item._key, parentId);
    };

    return (
      <Popover
        ref={ref}
        {...restProps}
        style={{ ...restProps.style, width: '310px' }}
        className={`${darkMode ? 'dark-theme theme-dark' : ''} nav-item-popover ${restProps.className || ''}`}
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
                <label data-cy="inspector-nav-item-details-label-label" className="nav-item-popover-field-label">
                  Label
                </label>
                <CodeHinter
                  {...basicCodeHinterProps}
                  data-cy="inspector-nav-item-details-label-input"
                  initialValue={item?.label}
                  onChange={(value) => handleChange('label', value)}
                  componentId={componentId}
                  paramName="label"
                  fieldMeta={{ type: 'string', validation: { schema: { type: 'string' }, defaultValue: 'Label' } }}
                />
              </div>

              {/* Id field */}
              <div data-cy="inspector-nav-item-details-id-field" className="nav-item-popover-field">
                <label data-cy="inspector-nav-item-details-id-label" className="nav-item-popover-field-label">
                  Id
                </label>
                <CodeHinter
                  key={idFieldResetKey}
                  {...basicCodeHinterProps}
                  data-cy="inspector-nav-item-details-id-input"
                  initialValue={item?.id}
                  placeholder={'Item ID'}
                  onChange={(value) => handleChange('id', value)}
                  // Commit synchronously on blur — the popover's rootClose can beat a deferred setTimeout(0) commit.
                  delayOnChange={false}
                  validationFn={validateIdField}
                  componentId={componentId}
                  paramName="id"
                  fieldMeta={{ type: 'string', validation: { schema: { type: 'string' }, defaultValue: 'itemId' } }}
                />
              </div>

              {!item.isGroup && (
                <div data-cy="inspector-nav-item-details-caption-field" className="nav-item-popover-field">
                  <label data-cy="inspector-nav-item-details-caption-label" className="nav-item-popover-field-label">
                    Caption
                  </label>
                  <CodeHinter
                    {...basicCodeHinterProps}
                    data-cy="inspector-nav-item-details-caption-input"
                    initialValue={item?.caption ?? ''}
                    placeholder={'Optional description'}
                    onChange={(value) => handleChange('caption', value)}
                    componentId={componentId}
                    paramName="caption"
                    fieldMeta={{ type: 'string', validation: { schema: { type: 'string' }, defaultValue: 'Caption' } }}
                  />
                </div>
              )}

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

            {/* Per-item events (On Click only). Groups have no events. Events are
                stored on the Navigation component and scoped to this item via ref. */}
            {!item.isGroup && componentId && (
              <div data-cy="inspector-nav-item-details-events-section" className="nav-item-popover-events-section">
                <EventManager
                  sourceId={componentId}
                  eventSourceType="component"
                  eventMetaDefinition={NAV_ITEM_EVENT_META}
                  customEventRefs={{ ref: item.id }}
                  darkMode={darkMode}
                />
              </div>
            )}
          </div>
        </div>
      </Popover>
    );
  }
);

NavItemPopover.displayName = 'NavItemPopover';

export default NavItemPopover;
