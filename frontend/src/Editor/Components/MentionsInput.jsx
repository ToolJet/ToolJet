import React, { useState, useEffect, useRef } from 'react';
import { Mentions, ConfigProvider } from 'antd';
import { theme } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const MentionsInput = function MentionsInput({
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
    const [options, setOptions] = useState(properties.options);
    const [defaultValue, setDefaultValue] = useState(properties.defaultValue);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);

    useEffect(() => {
        if (properties.options instanceof Object) {
            for (let key in properties.options) {
                if (properties.options.hasOwnProperty(key) && !Array.isArray(properties.options[key])) {
                    properties.options[key] = []
                }
            }
            setOptions(properties.options)
        }
        else
            setOptions({})
    }, [JSON.stringify(properties.options)])

    useEffect(() => {
        setDefaultValue(properties.defaultValue)
    }, [properties.defaultValue])

    useEffect(() => {
        setPlaceholder(properties.placeholder)
    }, [properties.placeholder])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    const onChange = (value) => {
        setExposedVariable('context', value)
        fireEvent('onChange')
    };
    const onSelect = (option) => {
        setExposedVariable('lastSelect', option)
        fireEvent('onSelect')
    };

    const onBlur = () => {
        // 触发事件
        fireEvent('onBlur');
    }

    const [prefix, setPrefix] = useState('@');
    const onSearch = (_, newPrefix) => {
        setPrefix(newPrefix);
    };

    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : null}
        >
            <Mentions
                style={{
                    width: '100%',
                    height
                }}
                rows={height / 22}
                prefix={Object.keys(options)}
                onChange={onChange}
                onSelect={onSelect}
                onSearch={onSearch}
                onBlur={onBlur}
                placeholder={placeholder}
                defaultValue={defaultValue}
                options={(options[prefix] || []).map((value) => ({
                    key: value,
                    value,
                    label: value,
                }))}
            />
        </ConfigProvider>
    </div>)
}