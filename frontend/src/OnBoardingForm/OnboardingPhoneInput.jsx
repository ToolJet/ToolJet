import React, { useState } from 'react';

function OnboardingPhoneInput() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('');

  function handlePhoneNumberChange(event) {
    const inputPhoneNumber = event.target.value;
    setPhoneNumber(inputPhoneNumber);
  }

  function handleCountryCodeChange(event) {
    const inputCountryCode = event.target.value;
    setCountryCode(inputCountryCode);
  }

  function validatePhoneNumber(phoneNumber) {
    const isValidPhoneNumber = /^\d{3}-\d{3}-\d{4}$/.test(phoneNumber);
    return isValidPhoneNumber;
  }

  return (
    <div>
      <div className="d-flex" style={{ marginBottom: '12px' }}>
        <select id="country-code" name="country-code" value={countryCode} onChange={handleCountryCodeChange} required>
          {/* <option value="">Select Country Code</option> */}
          <option value="+1">USA +1 </option>
          <option value="+44">(UK) +44 </option>
          <option value="+91" selected="selected">
            INDIA +91
          </option>
        </select>
        <input
          type="tel"
          id="phone-input"
          name="phone-input"
          placeholder="123-456-7890"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
          required
        />
      </div>
      {/* {!validatePhoneNumber(phoneNumber) && <span style={{ color: 'red' }}>Please enter a valid phone number</span>} */}
    </div>
  );
}

export default OnboardingPhoneInput;
