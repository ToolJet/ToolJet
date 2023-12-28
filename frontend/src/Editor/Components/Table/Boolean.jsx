import React from 'react';

export const Boolean = () => {
  return (
    <div className="w-100 ">
      <label class="boolean-switch">
        <input type="checkbox" />
        <span class="boolean-slider round"></span>
      </label>
    </div>
  );
};
