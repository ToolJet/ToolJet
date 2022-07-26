import React from 'react';

export const Tags = () => {
  return (
    <>
      <div className="subheader mb-2">Tags</div>
      <div className="mb-3">
        <label className="form-check mb-1">
          <input type="checkbox" className="form-check-input" name="form-tags[]" value="business" />
          <span className="form-check-label">API</span>
        </label>
        <label className="form-check mb-1">
          <input type="checkbox" className="form-check-input" name="form-tags[]" value="evening" />
          <span className="form-check-label">Database</span>
        </label>
        <label className="form-check mb-1">
          <input type="checkbox" className="form-check-input" name="form-tags[]" value="leisure" />
          <span className="form-check-label">Cloud storage</span>
        </label>
      </div>
    </>
  );
};
