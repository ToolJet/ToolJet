import React from 'react';

export const Checkbox = ({ label, onChange, key = '', value }) => {
  const handleOnchange = (event) => {
    onChange(event, value);
  };

  return (
    <div key={key} className="form-check mx-1">
      <input
        style={{
          backgroundColor: '#D7DBDF',
        }}
        className="form-check-input"
        type="checkbox"
        onChange={handleOnchange}
      />
      <label className="form-check-label">{label}</label>
    </div>
  );
};

export const CheckboxGroup = ({ label, options = [], onChange }) => {
  const [checkedItems, setCheckedItems] = React.useState([]);

  React.useEffect(() => {
    onChange(checkedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedItems]);

  const handleCheckboxChange = (event, value) => {
    const checked = event.target.checked;

    if (checked) {
      setCheckedItems([...checkedItems, value]);
    }
  };

  return (
    <div className="form-group d-flex">
      <label>{label}</label>
      {options.map((option, index) => {
        return <Checkbox key={index} label={option.label} value={option.value} onChange={handleCheckboxChange} />;
      })}
    </div>
  );
};
