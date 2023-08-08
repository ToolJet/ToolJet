/* eslint-disable no-unused-vars */
import React from 'react';
import './style.scss';
import SolidIcon from '@/_ui/Icon/solidIcons/index';
//warning not fully customizable/robust yet, do noe use anywhere apart from table, till we make it more robust
const SingleOptionOflist = ({
  children,
  size = '',
  darkMode,
  className = '',
  onClickFunction,
  dataCy = '',
  ...restProps
}) => {
  console.log('kavin', { restProps });
  const baseHeight = size === 'sm' ? 36 : 40;
  const baseFontClass = `tj-text ${size === 'sm' ? 'tj-text-xsm' : 'tj-text-sm'}`;
  return (
    <div
      style={{ width: '100%', height: baseHeight }}
      className={`${darkMode && 'dark-theme'} ${className} custom-single-option ${baseFontClass}`}
      onClick={onClickFunction}
      data-cy={dataCy}
      tabIndex={0}
      {...restProps?.column?.getToggleHiddenProps()}
    >
      {children}
    </div>
  );
};

const optionForInput = ({
  showDot,
  showAvatar,
  showLeadingIcon = false,
  leadingIcon,
  optionText = '',
  showAddOn = false,
  addOnText = '',
  showCheck,
  size,
  darkMode,
}) => {
  const baseDimensionOfDot = size === 'sm' ? { width: 6, height: 6 } : { width: 8, height: 8 };
  const baseDimensionOfIcon =
    size === 'sm' ? { width: 16, height: 16, viewBox: '0 0 16 16' } : { width: 20, height: 20, viewBox: '0 0 20 20' };
  const dot = showDot ? (
    <SolidIcon
      fill={darkMode ? '#65BA75' : '#46A758'}
      name={dot}
      width={baseDimensionOfDot.width}
      height={baseDimensionOfDot.height}
    />
  ) : (
    ''
  );
  const avatar = showAvatar ? <img className="mx-1" src="avatar.png" width="20" height="20" /> : '';
  //leading icon needs to be discussed
  const icon = showLeadingIcon ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={baseDimensionOfIcon.width}
      height={baseDimensionOfIcon.height}
      viewBox={baseDimensionOfIcon.viewBox}
      fill="none"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15.0001 2.41663H5.00008C3.15913 2.41663 1.66675 3.90901 1.66675 5.74996V15.75C1.66675 17.5909 3.15913 19.0833 5.00008 19.0833H15.0001C16.841 19.0833 18.3334 17.5909 18.3334 15.75V5.74996C18.3334 3.90901 16.841 2.41663 15.0001 2.41663ZM7.91221 12.7801C7.65416 12.5537 7.26136 12.5778 7.03296 12.8347C6.80363 13.0927 6.82687 13.4878 7.08486 13.7171L7.31407 13.8932C7.44935 13.9873 7.64344 14.1088 7.89148 14.229C8.38759 14.4696 9.10572 14.7083 10.0001 14.7083C10.8945 14.7083 11.6126 14.4696 12.1087 14.229C12.3567 14.1088 12.5508 13.9873 12.6861 13.8932C12.7538 13.8461 12.8072 13.8056 12.8455 13.7752L12.9153 13.7171C13.1733 13.4878 13.1965 13.0927 12.9672 12.8347C12.7388 12.5778 12.346 12.5537 12.088 12.7801L11.9723 12.8671C11.8829 12.9293 11.745 13.0162 11.5634 13.1042C11.2001 13.2804 10.6682 13.4583 10.0001 13.4583C9.33196 13.4583 8.80008 13.2804 8.43682 13.1042C8.25517 13.0162 8.11723 12.9293 8.0279 12.8671L7.91221 12.7801ZM14.1667 9.08329C14.1667 9.54353 13.7937 9.91663 13.3334 9.91663C12.8732 9.91663 12.5001 9.54353 12.5001 9.08329C12.5001 8.62306 12.8732 8.24996 13.3334 8.24996C13.7937 8.24996 14.1667 8.62306 14.1667 9.08329ZM6.66675 9.91663C7.12699 9.91663 7.50008 9.54353 7.50008 9.08329C7.50008 8.62306 7.12699 8.24996 6.66675 8.24996C6.20651 8.24996 5.83341 8.62306 5.83341 9.08329C5.83341 9.54353 6.20651 9.91663 6.66675 9.91663Z"
        fill={darkMode ? '#4C5155' : '#C1C8CD'}
      />
    </svg>
  ) : (
    ''
  );
  const text = optionText ? <span className="tj-text">{optionText}</span> : '';
  const addOn = showAddOn && addOnText ? <span>{addOnText}</span> : '';
  const check = showCheck ? (
    <SolidIcon fill={darkMode ? '#3E63DD' : '#3E63DD'} name={check} width={20} height={20} viewBox="0 0 20 20" />
  ) : (
    ''
  );
  const content = [dot, avatar, icon, text, addOn, check];
  return content;
};

const optionForPopover = ({
  size,
  showCheckbox = false,
  showIcon = false,
  icon = '',
  optionText = '',
  showShortcut = false,
  shortcutText,
  darkMode,
  theme,
}) => {
  const checkbox = showCheckbox ? <input type="checkbox" name="" id="" /> : '';
  const iconSvg = showIcon ? (
    <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 20 20" fill="none">
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15.0001 2.41663H5.00008C3.15913 2.41663 1.66675 3.90901 1.66675 5.74996V15.75C1.66675 17.5909 3.15913 19.0833 5.00008 19.0833H15.0001C16.841 19.0833 18.3334 17.5909 18.3334 15.75V5.74996C18.3334 3.90901 16.841 2.41663 15.0001 2.41663ZM7.91221 12.7801C7.65416 12.5537 7.26136 12.5778 7.03296 12.8347C6.80363 13.0927 6.82687 13.4878 7.08486 13.7171L7.31407 13.8932C7.44935 13.9873 7.64344 14.1088 7.89148 14.229C8.38759 14.4696 9.10572 14.7083 10.0001 14.7083C10.8945 14.7083 11.6126 14.4696 12.1087 14.229C12.3567 14.1088 12.5508 13.9873 12.6861 13.8932C12.7538 13.8461 12.8072 13.8056 12.8455 13.7752L12.9153 13.7171C13.1733 13.4878 13.1965 13.0927 12.9672 12.8347C12.7388 12.5778 12.346 12.5537 12.088 12.7801L11.9723 12.8671C11.8829 12.9293 11.745 13.0162 11.5634 13.1042C11.2001 13.2804 10.6682 13.4583 10.0001 13.4583C9.33196 13.4583 8.80008 13.2804 8.43682 13.1042C8.25517 13.0162 8.11723 12.9293 8.0279 12.8671L7.91221 12.7801ZM14.1667 9.08329C14.1667 9.54353 13.7937 9.91663 13.3334 9.91663C12.8732 9.91663 12.5001 9.54353 12.5001 9.08329C12.5001 8.62306 12.8732 8.24996 13.3334 8.24996C13.7937 8.24996 14.1667 8.62306 14.1667 9.08329ZM6.66675 9.91663C7.12699 9.91663 7.50008 9.54353 7.50008 9.08329C7.50008 8.62306 7.12699 8.24996 6.66675 8.24996C6.20651 8.24996 5.83341 8.62306 5.83341 9.08329C5.83341 9.54353 6.20651 9.91663 6.66675 9.91663Z"
        fill={darkMode ? '#4C5155' : '#C1C8CD'}
      />
    </svg>
  ) : (
    ''
  );
  const text = optionText ? <span>{optionText}</span> : '';
  const shortcut = showShortcut ? <span>{shortcutText}</span> : '';
  const content = [checkbox, iconSvg, text, shortcut];
  return content;
};

SingleOptionOflist.inputOption = optionForInput;
SingleOptionOflist.optionForPopover = optionForPopover;
export default SingleOptionOflist;
