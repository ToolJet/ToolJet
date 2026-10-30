import React from 'react';

export default function ErrorModal({ onClose }) {
  return (
    <div>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">QR Scanner is not working</h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            Please make sure a camera is available on your device. Try closing your browser and opening it again, if it
            doesn&apos;t work, please contact support.
          </div>
          <div className="modal-footer">
            <button type="button" className="btn" data-bs-dismiss="modal" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
