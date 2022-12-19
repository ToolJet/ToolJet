export default function styles(darkMode, width = 224, height = 32, styles = {}) {
  return {
    container: (provided) => ({
      ...provided,
      width: width,
      height: height,
    }),
    control: (provided, state) => ({
      ...provided,
      border: styles.border ?? '1px solid hsl(0, 0%, 80%)',
      boxShadow: 'none',
      '&:hover': {
        border: styles.border ?? '1px solid hsl(0, 0%, 80%)',
      },
      backgroundColor: darkMode ? '#2b3547' : state.menuIsOpen ? '#F1F3F5' : '#fff',
      height: height,
      minHeight: height,
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      height: height,
      marginBottom: '4px',
    }),
    indicatorsContainer: (provided, state) => ({
      ...provided,
      height: height,
    }),
    indicatorSeparator: (state) => ({
      display: 'none',
    }),
    input: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: darkMode ? '#2b3547' : '#fff',
      color: darkMode ? '#fff' : '#232e3c',
      ':hover': {
        backgroundColor: darkMode ? '#323C4B' : '#d8dce9',
      },
    }),
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#808080',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 2000 }),
  };
}
