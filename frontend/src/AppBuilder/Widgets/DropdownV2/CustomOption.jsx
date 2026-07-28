import React from 'react';
import { components } from 'react-select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import './dropdownV2.scss';
import { highlightText } from './utils';

const CustomOption = (props) => {
  const caption = props.data?.caption;
  const hasCaption = caption !== null && caption !== undefined && caption !== '';
  const captionText = hasCaption ? String(caption) : '';
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
      <div className="cursor-pointer tw-flex tw-min-w-0 tw-w-full">
        {props.isSelected && (
          <span className="tw-shrink-0" style={{ maxHeight: '20px', marginRight: '8px', marginLeft: '-28px' }}>
            <CheckMark width={'20'} fill={'var(--cc-primary-brand)'} />
          </span>
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
