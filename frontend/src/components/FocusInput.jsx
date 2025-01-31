import React from 'react';
import useFocus from '../_hooks/use-focus';

const FocusInput = () => {
  const [inputRef, setInputFocus] = useFocus();

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="Click the button to focus" />
      <button onClick={setInputFocus}>Focus the input</button>
    </div>
  );
};

export default FocusInput;