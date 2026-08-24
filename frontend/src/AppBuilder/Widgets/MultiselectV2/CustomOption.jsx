import React from 'react';
import { components } from 'react-select';
const { Option } = components;
import { FormCheck } from 'react-bootstrap';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import './multiselectV2.scss';
import { highlightText } from '../DropdownV2/utils';

const CustomOption = (props) => {
  const labelText = String(props.label ?? '');
  const caption = props.data?.caption;
  const hasCaption = caption !== null && caption !== undefined && caption !== '';
  const captionText = hasCaption ? String(caption) : '';
  const isSelectAll = labelText.includes('Select all');
  const { icon, iconVisibility, image } = props.data || {};
  const showIcon = !isSelectAll && iconVisibility && !!icon;
  const showImage = !isSelectAll && !!image;
  // Server-side search: results come pre-filtered from the backend, so skip client-side highlighting.
  const serverSideSearch = props.selectProps.serverSideSearch === true;
  const renderWithHighlight = (text) => (serverSideSearch ? text : highlightText(text, props.selectProps.inputValue));

  return (
    <Option
      {...props}
      innerProps={{
        ...props.innerProps,
      }}
    >
      <div className="d-flex multiselct-widget-option custom-gap-6" style={{ alignItems: 'center' }}>
        <FormCheck checked={props.isSelected} disabled={props?.isDisabled} />
        {showIcon && (
          <span className="tw-shrink-0 tw-flex tw-items-center">
            <TablerIcon
              iconName={icon}
              style={{ width: '16px', height: '16px', color: 'var(--cc-default-icon)' }}
              stroke={1.5}
              data-cy={`multiselect-option-${props.data?.value}-icon`}
            />
          </span>
        )}
        {showImage && (
          <img
            src={image}
            alt=""
            className="tw-shrink-0"
            style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="tw-min-w-0 tw-flex-1 tw-flex tw-flex-col">
          <span className="tw-truncate" title={labelText}>
            {isSelectAll ? 'Select all' : renderWithHighlight(labelText)}
          </span>
          {!isSelectAll && hasCaption && (
            <span className="multiselectV2-option-caption tw-truncate" title={captionText}>
              {highlightText(captionText, props.selectProps.inputValue)}
            </span>
          )}
        </div>
      </div>
    </Option>
  );
};

export default CustomOption;
