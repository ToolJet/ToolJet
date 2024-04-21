import React, { useState, useEffect, useRef } from 'react';
import { Cascader, ConfigProvider } from 'antd';
import { theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';


const { darkAlgorithm, compactAlgorithm } = theme;

export const Cascaders = function Cascaders({
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
    const [placement, setPlacement] = useState(styles.placement);

    const [options, setOptions] = useState();
    const [multiple, setMultiple] = useState(properties.multiple);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [expandTrigger, setExpandTrigger] = useState(properties.expandTrigger);
    const [defaultValue, setDefaultValue] = useState(properties.defaultValue);
    const [customMap, setCustomMap] = useState(properties.customMap);
    const [searchAllPY, setSearchAllPY] = useState(properties.searchAllPY);
    const [searchFirstPY, setSearchFirstPY] = useState(properties.searchFirstPY);

    useEffect(() => {
        setOptions(properties.options)
    }, [JSON.stringify(properties.options)])

    useEffect(() => {
        setPlaceholder(properties.placeholder)
    }, [properties.placeholder])

    useEffect(() => {
        setExpandTrigger(properties.expandTrigger)
    }, [properties.expandTrigger])

    useEffect(() => {
        setDefaultValue(properties.defaultValue)
        setMultiple(properties.multiple)
        setSearchAllPY(properties.searchAllPY)
        setSearchFirstPY(properties.searchFirstPY)
        setExposedVariable('selectValue', properties.defaultValue)
    }, [properties.defaultValue?.toString(), properties.multiple, properties.searchAllPY, properties.searchFirstPY])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setPlacement(styles.placement)
    }, [styles.visibility, styles.disabledState, styles.placement])
    useEffect(() => {
        setCustomMap(properties.customMap)
    }, [properties.customMap])

    const onChange = (value, selectedOptions) => {
        setExposedVariable('selectedOptions', selectedOptions)
        setExposedVariable('selectValue', value)
        fireEvent('onSelect');
    };
    const onSearch = (value) => {
        setExposedVariable('searchText', value)
        fireEvent('onSearchTextChanged');
    }
    const filter = (inputValue, path) =>
        path.some((option) => {
            return option.label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1 ||
                (searchAllPY && option.label.spell().toLowerCase().indexOf(inputValue.toLowerCase()) > -1) ||
                (searchFirstPY && option.label.spell('first').toLowerCase().indexOf(inputValue.toLowerCase()) > -1)
        });
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
        token: {
            controlHeight: height + 4
        }
    };

    return (<div className='text-input' style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    controlHeight: height
                }
            }}
            locale={zhCN}
        >
            <Cascader
                options={options}
                onChange={onChange}
                placeholder={placeholder}
                style={{ width: width - 5 }}
                disabled={disabledState}
                expandTrigger={expandTrigger}
                defaultValue={defaultValue}
                showSearch={{
                    filter,
                }}
                onSearch={onSearch}
                fieldNames={customMap}
                placement={placement}
                theme={darkTheme}
                multiple={multiple}
            />
        </ConfigProvider>

    </div>)
}