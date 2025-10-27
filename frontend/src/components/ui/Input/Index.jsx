import React from 'react';
import PropTypes from 'prop-types';
import CommonInput from './CommonInput/Index';
import EncryptedField from '../EncryptedField/Index';

const InputComponent = (props) => {
  const { encrypted, showEncryption, type, isEditing, propertyKey, handleEncryptedFieldsToggle, isDisabled } = props;

  // Check if we need encryption wrapper
  const shouldWrapWithEncryption = showEncryption && encrypted && type === 'password';

  if (shouldWrapWithEncryption) {
    return (
      <EncryptedField
        propertyKey={propertyKey}
        isEditing={isEditing}
        handleEncryptedFieldsToggle={handleEncryptedFieldsToggle}
        isDisabled={isDisabled}
      >
        <CommonInput {...props} />
      </EncryptedField>
    );
  }

  return <CommonInput {...props} />;
};

export default InputComponent;

InputComponent.propTypes = {
  type: PropTypes.oneOf(['text', 'number', 'password', 'email']),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onClear: PropTypes.func,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  id: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  readOnly: PropTypes.string,
  validation: PropTypes.func,
  label: PropTypes.string,
  'aria-label': PropTypes.string,
  required: PropTypes.bool,
  leadingIcon: PropTypes.string,
  trailingAction: PropTypes.oneOf(['clear', 'loading']),
  trailingActionDisabled: PropTypes.bool,
  helperText: PropTypes.string,
};

InputComponent.defaultProps = {
  type: 'text',
  onChange: (_e, _validateObj) => {},
  onClear: () => {},
  placeholder: '',
  name: '',
  id: '',
  size: 'medium',
  disabled: false,
  readOnly: '',
  validation: null,
  label: '',
  'aria-label': '',
  required: false,
  leadingIcon: '',
  trailingAction: '',
  trailingActionDisabled: false,
  helperText: '',
};
