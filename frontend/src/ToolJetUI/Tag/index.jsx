import React from 'react';
import PropTypes from 'prop-types';
import './styles.scss';

const Tag = ({ text, callBack = null, handleIconCallBack, type = 'tooljet-tag-base', dataCy = '', renderIcon }) => {
  const mapTagType = Object.freeze({
    base: 'tooljet-tag-base',
    default: 'tooljet-tag-default',
    filter: 'tooljet-tag-filter',
  });

  const Icon = () => renderIcon();

  const rootClassName = mapTagType[type] || mapTagType.default;

  return (
    <div
      data-cy={dataCy}
      className={`${rootClassName} ${!handleIconCallBack && callBack && 'cursor-pointer'}`}
      onClick={!handleIconCallBack && callBack && callBack}
    >
      <div className="d-flex">
        <span className="mx-1">{text}</span>
        {!callBack && handleIconCallBack && (
          <div
            className="tag-icon cursor-pointer"
            title="clear"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleIconCallBack();
            }}
          >
            <Icon />
          </div>
        )}
      </div>
    </div>
  );
};

Tag.propTypes = {
  text: PropTypes.string.isRequired,
  callBack: PropTypes.func || null,
  handleIconCallBack: PropTypes.func || null,
  type: PropTypes.string,
  dataCy: PropTypes.string,
  renderIcon: PropTypes.func || PropTypes.element,
};

export default Tag;
