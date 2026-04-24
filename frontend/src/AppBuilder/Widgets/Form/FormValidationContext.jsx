import { createContext, useContext, useEffect } from 'react';

const FormValidationContext = createContext({ submitAttemptCount: 0 });

export const useFormValidation = () => useContext(FormValidationContext);

/**
 * When a parent Form has validate-on-submit and submission fails, the form increments
 * `submitAttemptCount`. Call this with the same `setState` you use to reveal validation
 * after blur/change (e.g. setShowValidationError or setUserInteracted).
 */
export const useShowValidationOnFormSubmit = (setVisible) => {
  const { submitAttemptCount } = useFormValidation();
  useEffect(() => {
    if (submitAttemptCount > 0) setVisible(true);
  }, [submitAttemptCount, setVisible]);
};

export default FormValidationContext;
