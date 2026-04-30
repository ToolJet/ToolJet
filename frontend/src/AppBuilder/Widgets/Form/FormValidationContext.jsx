import { createContext, useContext, useEffect } from 'react';

const FormValidationContext = createContext(0);

export const useShowValidationOnFormSubmit = (setVisible) => {
  const submitAttemptCount = useContext(FormValidationContext);
  useEffect(() => {
    if (submitAttemptCount > 0) setVisible(true);
  }, [submitAttemptCount, setVisible]);
};

export default FormValidationContext;
