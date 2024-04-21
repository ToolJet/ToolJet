import React, { useState, useEffect, useRef } from 'react';
import { theme, ConfigProvider, AutoComplete, Input } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const Autocomplete = function Autocomplete({
    id,
    width,
    height,
    component,
    darkMode,
    currentState,
    onComponentOptionChanged,
    onComponentOptionsChanged,
    setExposedVariable,
    onEvent,
    canvasWidth,
    registerAction,
    properties,
    styles,
    fireEvent,
}) {
    const [visibility, setVisibility] = useState(styles.visibility);
    const [disabledState, setDisabledState] = useState(styles.disabledState);
    const [searchFirstPY, setSearchFirstPY] = useState(properties.searchFirstPY);
    const [searchAllPY, setSearchAllPY] = useState(properties.searchAllPY);
    const [datas, setDatas] = useState([]);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [searchLabelOnly, setSearchLabelOnly] = useState(properties.searchLabelOnly);
    const [searchIcon, setSearchIcon] = useState(styles.searchIcon);
    const [text, setText] = useState(properties.defaultValue);
    const [selectKey, setSelectKey] = useState();

    useEffect(() => {
        if (Array.isArray(properties.datas))
            setDatas(properties.datas)
        else
            setDatas([])
    }, [properties.datas])

    useEffect(() => {
        setText(properties.defaultValue)
    }, [properties.defaultValue])

    useEffect(() => {
        setSearchFirstPY(properties.searchFirstPY)
        setSearchAllPY(properties.searchAllPY)
    }, [properties.searchAllPY, properties.searchFirstPY])

    useEffect(() => {
        setPlaceholder(properties.placeholder)
    }, [properties.placeholder])

    useEffect(() => {
        if (selectKey === '')
            setSelectKey('value')
        setSelectKey(properties.selectKey)
    }, [properties.selectKey])

    useEffect(() => {
        setSearchLabelOnly(properties.searchLabelOnly)
    }, [properties.searchLabelOnly])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setSearchIcon(styles.searchIcon)
    }, [styles.visibility, styles.disabledState, styles.searchIcon])

    const handleOnSearch = (string, results) => {
        setExposedVariable('searchText', string)
        setExposedVariable('text', string)
        setText(string)
        setExposedVariable('selected', false)
        fireEvent('onSearchTextChanged');
    }

    const handleOnSelect = (item, option) => {
        setExposedVariable('selectedItem', option)
        setExposedVariable('text', option[selectKey])
        setText(option[selectKey])
        setExposedVariable('selected', true)
        fireEvent('onSelect');
    }

    registerAction('setValue',
        async function (value, selected) {
            setExposedVariable('text', value)
            setText(value)
            setExposedVariable('selected', selected === true)
        }, [setText]);

    const handleOnFocus = () => {
        fireEvent('onFocus');
    }

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };
    return (<div style={{ display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    controlHeight: height - 2,
                    lineHeight: 1.1,
                }
            }}
        >
            <AutoComplete
                value={text}
                disabled={disabledState}
                style={{
                    width: width - 3,
                }}
                placeholder={placeholder}
                options={datas}
                allowClear={searchIcon === ''}
                onSelect={handleOnSelect}
                notFoundContent={(<span style={{ color: '#b3b3b3' }} >未找到</span>)}
                filterOption={(inputValue, option) => {
                    if (option?.label && option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1) return true
                    if (searchFirstPY && option?.label && option.label.spell('first').toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) return true
                    if (searchAllPY && option?.label && option.label.spell().toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) return true
                    if (!searchLabelOnly) {
                        if (option?.value && option?.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1) return true
                        if (searchFirstPY && option?.value && option.value.spell('first').toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) return true
                        if (searchAllPY && option?.value && option.value.spell().toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) return true
                    }
                    return false

                }
                }
                onSearch={handleOnSearch}
                onFocus={handleOnFocus}
            >
                {searchIcon !== '' ? (<Input.Search
                    allowClear
                    enterButton={searchIcon === 'primary'} />) : ''
                }
            </AutoComplete>
        </ConfigProvider>
    </div>)
}