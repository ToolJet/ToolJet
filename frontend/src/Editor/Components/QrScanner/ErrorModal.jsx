import React, { useState } from 'react';

export default function ErrorModal() {

  const [show, setShow] = React.useState(true)

  const close = () => {
    setShow(false)
  }
  
  return(
    <div>
      {
        show ?
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">QR Scanner is not working</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={close}></button>
              </div>
              <div class="modal-body">
                Corresponding error log is available on your browser console. Try reloading the page, if it doesn't work, please contact support.
              </div>
              <div class="modal-footer">
                <button type="button" class="btn" data-bs-dismiss="modal" onClick={close}>Close</button>
              </div>
            </div>
          </div>
        :
          ''
      }
    </div>
  );
};
