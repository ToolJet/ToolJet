import { useState, useEffect } from 'react';

/**
 * Custom hook for password input functionality
 * @param {Object} options - Configuration options
 * @param {Function} options.onChange - Change handler function
 * @param {Function} options.validation - Validation function
 * @param {Object} options.isValidatedMessages - External validation messages
 * @param {boolean} options.disabled - Whether input is disabled
 * @returns {Object} Password input state and handlers
 */
export const usePasswordInput = ({ onChange, validation, isValidatedMessages }) => {
  const [isValid, setIsValid] = useState(null);
  const [message, setMessage] = useState('');

  /**
   * Handle input change with validation
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    if (validation) {
      const validateObj = validation(e);
      setIsValid(validateObj.valid);
      setMessage(validateObj.message);
      onChange(e, validateObj);
    } else {
      onChange(e);
    }
  };

  // Update validation state when external validation messages change
  useEffect(() => {
    if (isValidatedMessages) {
      setIsValid(isValidatedMessages.valid);
      setMessage(isValidatedMessages.message);
    }
  }, [isValidatedMessages]);

  return {
    // State
    isValid,
    message,

    // Handlers
    handleChange,
  };
};
