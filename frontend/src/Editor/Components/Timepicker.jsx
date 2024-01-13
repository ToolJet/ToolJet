import React, { useState } from 'react';

export const TimePicker = ({ onSelect, isOpen, togglePopover }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  const [selectedHour, setSelectedHour] = useState(1);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

  const handleHourChange = (event) => {
    setSelectedHour(parseInt(event.target.value, 10));
  };

  const handleMinuteChange = (event) => {
    setSelectedMinute(parseInt(event.target.value, 10));
  };

  const handlePeriodChange = (event) => {
    setSelectedPeriod(event.target.value);
  };

  const handleConfirm = () => {
    const formattedHour = selectedPeriod === 'PM' ? selectedHour + 12 : selectedHour;
    const formattedMinute = selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute;
    const formattedTime = `${formattedHour}:${formattedMinute}`;
    onSelect(formattedTime);
    togglePopover();
  };

  return (
    <div className={`time-picker ${isOpen ? 'open' : ''}`}>
      <div className="column">
        <label>Hour:</label>
        <select value={selectedHour} onChange={handleHourChange}>
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
      </div>
      <div className="column">
        <label>Minute:</label>
        <select value={selectedMinute} onChange={handleMinuteChange}>
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {minute < 10 ? `0${minute}` : minute}
            </option>
          ))}
        </select>
      </div>
      <div className="column">
        <label>Period:</label>
        <select value={selectedPeriod} onChange={handlePeriodChange}>
          {periods.map((period) => (
            <option key={period} value={period}>
              {period}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleConfirm}>Confirm</button>
    </div>
  );
};
