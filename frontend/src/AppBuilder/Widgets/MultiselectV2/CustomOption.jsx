import React from 'react';
import { components } from 'react-select';
const { Option } = components;
import { FormCheck } from 'react-bootstrap';
import './multiselectV2.scss';
import { highlightText } from '../DropdownV2/utils';

const CustomOption = (props) => {
  const labelText = String(props.label ?? '');
  const caption = props.data?.caption;
  const hasCaption = caption !== null && caption !== undefined && caption !== '';
  const captionText = hasCaption ? String(caption) : '';
  const isSelectAll = labelText.includes('Select all');
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
      <div className="d-flex multiselct-widget-option" style={{ alignItems: 'flex-start' }}>
        <FormCheck checked={props.isSelected} disabled={props?.isDisabled} />
        <div className="tw-min-w-0 tw-flex-1 tw-flex tw-flex-col" style={{ marginLeft: '5px' }}>
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
