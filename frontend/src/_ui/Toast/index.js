import React from 'react';
import { toast, Toaster, ToastBar } from 'react-hot-toast';

const Toast = ({t, icon, message}) => {

  return (
    <>
      <Toaster>
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                <button
                  className="btn-close"
                  onClick={() => toast.dismiss(t.id)} />
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  )
}

export default Toast;
