import React from 'react';

export const Checkbox = ({ label, isChecked, onChange, key = '', value }) => {
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
        checked={isChecked}
      />
      <label className="form-check-label">{label}</label>
    </div>
  );
};

export const CheckboxGroup = ({ label, options = [], values, onChange }) => {
  const [checkedItems, setCheckedItems] = React.useState(values);

  React.useEffect(() => {
    onChange(checkedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedItems]);

  const handleCheckboxChange = (event, value) => {
    const checked = event.target.checked;

    if (checked) {
      setCheckedItems([...checkedItems, value]);
    } else {
      setCheckedItems(checkedItems.filter((item) => item !== value));
    }
  };

  return (
    <div className="form-group d-flex">
      <label>{label}</label>
      {options.map((option, index) => {
        const isChecked = checkedItems.includes(option.value);
        return (
          <Checkbox
            key={index}
            label={option.label}
            value={option.value}
            isChecked={isChecked}
            onChange={handleCheckboxChange}
          />
        );
      })}
    </div>
  );
};
