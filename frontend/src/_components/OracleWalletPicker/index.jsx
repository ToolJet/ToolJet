import React, { useRef } from 'react';

const OracleWalletPicker = ({ value, onChange, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Strip out the 'data:application/zip;base64,' prefix
        const base64String = reader.result.split(',')[1];
        onChange(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="py-2">
      <div className="d-flex align-items-center">
        <input
          type="file"
          accept=".zip"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled}
          className="form-control"
          style={{ width: 'auto', flex: 1 }}
        />
        {value && !disabled && (
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={handleClear}>
            Clear
          </button>
        )}
      </div>
      {value && (
        <span className="text-success mt-1 d-block">
          <small>Wallet uploaded successfully.</small>
        </span>
      )}
    </div>
  );
};

export default React.memo(OracleWalletPicker, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && prevProps.disabled === nextProps.disabled;
});
