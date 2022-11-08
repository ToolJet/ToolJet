import React from 'react';
import { toast, Toaster, ToastBar } from 'react-hot-toast';

const Toast = ({ toastOptions }) => {
  return (
    <Toaster toastOptions={toastOptions}>
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <>
              {icon}
              {message}
              <button className="btn-close" onClick={() => toast.dismiss(t.id)} data-cy="toast-close-button" />
            </>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};

export default Toast;
