import React from 'react';

const styles = `
  .form-check-input:checked {
    background-color: #4A90E2;
    border-color: #4A90E2;
  }

  .form-check-input:focus {
    border-color: #4A90E2;
    box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
  }
`;

export const Checkbox = ({ label, isChecked, onChange, key = '', value }) => {
  const handleOnchange = (event) => {
    onChange(event, value);
  };

  return (
    <div key={key} className="form-check mx-1">
      <input
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

  // ADDED: Inject styles into document
  React.useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

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
