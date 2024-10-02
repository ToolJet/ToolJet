/* eslint-disable no-unused-vars */
export default function styles(darkMode, width = 224, height = 32, styles = {}) {
  return {
    container: (provided) => ({
      ...provided,
      width: width,
      height: height,
    }),
    control: (provided, state) => ({
      ...provided,
      border: state.isDisabled && darkMode ? 'none' : styles.border ?? '1px solid var(--slate7)',
      boxShadow: 'none',
      '&:hover': {
        backgroundColor: darkMode ? '' : '#F8F9FA',
        border: styles.border ?? '1px solid hsl(0, 0%, 80%)',
      },
      backgroundColor: state.isDisabled
        ? darkMode
          ? '#1f2936'
          : '#f4f6fa'
        : darkMode
        ? '#2b3547'
        : state.menuIsOpen
        ? '#F1F3F5'
        : '#fff',
      height: height,
      minHeight: height,
      cursor: styles.cursor ?? 'pointer',
    }),
    valueContainer: (provided, state) => ({
      ...provided,
      display: 'flex',
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
      cursor: 'pointer',
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

export function queryManagerSelectComponentStyle(darkMode, width = 224, height = 32) {
  return {
    menuPortal: (provided) => ({ ...provided, zIndex: 999 }),
    menuList: (base) => ({
      ...base,
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '12px',
      cursor: 'pointer',
      backgroundColor: darkMode ? '#2b3547' : '#fff',
      color: darkMode ? '#fff' : '#11181C',
      ':hover': {
        backgroundColor: darkMode ? '#323C4B' : '#F8FAFF',
      },
    }),
    control: (provided) => ({
      ...provided,
      boxShadow: 'none',
      backgroundColor: darkMode ? '#2b3547' : '#ffffff',
      borderRadius: '6px',
      height: 32,
      minHeight: 32,
      borderColor: darkMode ? 'inherit' : ' #D7DBDF',
      '&:hover': {
        backgroundColor: darkMode ? '' : '#F8F9FA',
      },
      '&:active': {
        backgroundColor: darkMode ? '' : '#F8FAFF',
        borderColor: '#3E63DD',
        boxShadow: '0px 0px 0px 2px #C6D4F9 ',
      },
      cursor: 'pointer',
    }),
    container: (provided) => ({
      ...provided,
      width: width,
      height: height,
      borderRadius: '6px 0 0 6px',
    }),
    valueContainer: (provided, _state) => ({
      ...provided,
      marginBottom: '0',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#11181C',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: height,
    }),
    indicatorSeparator: (_state) => ({
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
    placeholder: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#11181C',
    }),
  };
}
