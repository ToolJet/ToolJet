import React from 'react';
import { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
const { ValueContainer, Placeholder } = components;
import './multiselectV2.scss';
import Cross from '@/_ui/Icon/solidIcons/Cross';
import cx from 'classnames';

const CROSS_ICON_WIDTH = 20;
const OPTION_RIGHT_MARGIN = 4;
const SHOW_REMAINING_OPTION_WIDTH = 39; // (including right side margin)

const CustomValueContainer = ({ ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  const showNoRemainingOpt = props.getValue().length - selectProps.visibleValues.length;
  const remainingOptions = props.getValue().slice(-showNoRemainingOpt);
  const [showOverlay, setShowOverlay] = React.useState(false);
  const removeOption = (index) => {
    const _val = props.getValue().filter((opt, i) => i !== index);
    selectProps.setSelected(_val);
  };
  const valueContainerWidth = selectProps?.containerRef?.current?.offsetWidth;
  const optionMaxWidth =
    valueContainerWidth - OPTION_RIGHT_MARGIN - (showNoRemainingOpt ? SHOW_REMAINING_OPTION_WIDTH : 0);
  const optionLabelWidth = valueContainerWidth - CROSS_ICON_WIDTH;
  return (
    <ValueContainer {...props}>
      <div className="w-full">
        <span
          ref={selectProps.containerRef}
          className="d-flex w-full align-items-center"
          style={{ marginBottom: '2px' }}
        >
          {selectProps?.doShowIcon && (
            <IconElement
              style={{
                width: '16px',
                height: '16px',
                color: selectProps?.iconColor,
                marginRight: '6px',
              }}
            />
          )}
          {!props.hasValue ? (
            <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
              {selectProps.placeholder}
            </Placeholder>
          ) : (
            <span className="d-flex" {...props} id="options">
              {selectProps?.visibleValues.map((element, index) => (
                <div
                  className="value-container-selected-option"
                  key={index}
                  style={{
                    maxWidth: optionMaxWidth,
                  }}
                >
                  <span
                    className="text-truncate"
                    style={{
                      maxWidth: optionLabelWidth ?? 'unset',
                    }}
                  >
                    {element.label}
                  </span>
                  <span className="value-container-selected-option-delete-icon" onClick={() => removeOption(index)}>
                    <Cross fill="var(--icons-strong)" width="20" />
                  </span>
                </div>
              ))}
              <OverlayTrigger
                trigger={['hover', 'focus']}
                placement={'bottom-start'}
                onToggle={(showOverlay) => {
                  setShowOverlay(showOverlay);
                }}
                show={showOverlay}
                overlay={
                  <Popover
                    className={cx('multiselect-widget-show-more-popover', {
                      'theme-dark dark-theme': selectProps.darkMode,
                    })}
                  >
                    <div onMouseEnter={() => setShowOverlay(true)} onMouseLeave={() => setShowOverlay(false)}>
                      <Popover.Body className={`value-container-selected-option-popover`}>
                        {remainingOptions.map((option, index) => (
                          <div className="value-container-selected-option" key={option.label}>
                            {option.label}
                            <span
                              className="value-container-selected-option-delete-icon"
                              onClick={(e) => {
                                if (remainingOptions.length === 1) setShowOverlay(false);
                                removeOption(index);
                              }}
                            >
                              <Cross fill="var(--icons-strong)" width="16" />
                            </span>
                          </div>
                        ))}
                      </Popover.Body>
                    </div>
                  </Popover>
                }
              >
                <div className="d-flex">
                  {showNoRemainingOpt !== 0 && (
                    <div
                      className="value-container-selected-option cursor-pointer"
                      style={{ paddingRight: '10px' }}
                    >{`+${showNoRemainingOpt}`}</div>
                  )}
                </div>
              </OverlayTrigger>
            </span>
          )}
        </span>
      </div>
    </ValueContainer>
  );
};

export default CustomValueContainer;
