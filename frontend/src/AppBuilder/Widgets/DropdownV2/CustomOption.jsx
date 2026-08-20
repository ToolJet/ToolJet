import React from 'react';
import { components } from 'react-select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import './dropdownV2.scss';
import { highlightText } from './utils';

const CustomOption = (props) => {
  const caption = props.data?.caption;
  const hasCaption = caption !== null && caption !== undefined && caption !== '';
  const captionText = hasCaption ? String(caption) : '';
  const { icon, iconVisibility, image } = props.data || {};
  const showIcon = iconVisibility && !!icon;
  // Server-side search: results come pre-filtered from the backend, so skip client-side highlighting.
  const serverSideSearch = props.selectProps.serverSideSearch === true;
  const renderWithHighlight = (text) => (serverSideSearch ? text : highlightText(text, props.selectProps.inputValue));
  return (
    <components.Option
      {...props}
      innerProps={{
        ...props.innerProps,
      }}
    >
      <div className="cursor-pointer tw-flex tw-min-w-0 tw-w-full tw-items-center custom-gap-6 tw-justify-start">
        {/* Always reserve the checkmark slot so labels/icons/images align across selected and
            unselected rows; render the tick inside only when this option is selected. */}
        <span className="tw-shrink-0 tw-flex tw-items-center" style={{ width: '16px', height: '20px' }}>
          {props.isSelected && (
            <TablerIcon
              iconName={'IconCheck'}
              style={{ width: '16px', height: '16px', color: 'var(--primary-accent-strong)' }}
              stroke={2}
              data-cy={`dropdown-option-${props.data?.value}-check`}
            />
          )}
        </span>
        {showIcon && (
          <span className="tw-shrink-0 tw-flex tw-items-center">
            <TablerIcon
              iconName={icon}
              style={{ width: '16px', height: '16px', color: 'var(--cc-default-icon)' }}
              stroke={1.5}
              data-cy={`dropdown-option-${props.data?.value}-icon`}
            />
          </span>
        )}
        {image && (
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
          <span className="tw-truncate" style={{ color: 'unset' }} title={props.label?.toString()}>
            {renderWithHighlight(props.label?.toString())}
          </span>
          {hasCaption && (
            <span className="dropdownV2-option-caption tw-truncate" title={captionText}>
              {renderWithHighlight(captionText)}
            </span>
          )}
        </div>
      </div>
    </components.Option>
  );
};

export default CustomOption;
