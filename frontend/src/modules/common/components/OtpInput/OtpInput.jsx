import React, { useRef } from 'react';
import cx from 'classnames';
import './resources/styles/otp-input.styles.scss';

const OtpInput = ({
  length = 6,
  value,
  onChange,
  error,
  errorText,
  autoFocus = true,
  disabled = false,
  centered = false,
}) => {
  const inputsRef = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const setDigit = (index, digit) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setDigit(index, '');
      return;
    }
    // Handle paste-into-single-box: spread remaining digits across following boxes
    const chars = raw.split('');
    const next = digits.slice();
    chars.forEach((char, offset) => {
      if (index + offset < length) {
        next[index + offset] = char;
      }
    });
    onChange(next.join(''));
    const lastFilled = Math.min(index + chars.length, length - 1);
    inputsRef.current[lastFilled]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.padEnd(length, '').slice(0, length).replace(/ /g, ''));
    const lastIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  return (
    <div className={cx('otp-input-wrapper', { 'otp-input-wrapper-centered': centered })}>
      <div className={cx('otp-input-boxes', { 'otp-input-boxes-error': !!error })}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            className="otp-input-box"
            value={digit}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            data-cy={`otp-input-box-${index}`}
          />
        ))}
      </div>
      {error && errorText && (
        <div className="otp-input-error" data-cy="otp-input-error">
          {errorText}
        </div>
      )}
    </div>
  );
};

export default OtpInput;
