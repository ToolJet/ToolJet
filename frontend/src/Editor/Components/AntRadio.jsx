import React, { useState, useEffect, useRef } from 'react';
import { Radio, ConfigProvider, theme } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const AntRadio = function AntRadio({
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
    const [datas, setDatas] = useState(properties.datas);
    const [defaultSelectKey, setDefaultSelectKey] = useState();
    const [radioType, setRadioType] = useState(properties.radioType);
    const [buttonSize, setButtonSize] = useState(properties.buttonSize);


    useEffect(() => {
        setDatas(properties.datas)
    }, [properties.datas])
    useEffect(() => {
        setDefaultSelectKey(properties.defaultSelectKey)
        setExposedVariable('checkedValue', properties.defaultSelectKey)
    }, [properties.defaultSelectKey])

    useEffect(() => {
        setRadioType(properties.radioType)
    }, [properties.radioType])

    useEffect(() => {
        setButtonSize(properties.buttonSize)
    }, [properties.buttonSize])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    registerAction(
        'setValue',
        async function (value) {
            setExposedVariable('checkedValue', value)
            setDefaultSelectKey(value);
        },
        []
    );

    const onChange = (e) => {
        setExposedVariable('checkedValue', e.target.value)
        setDefaultSelectKey(e.target.value);
        fireEvent('onChange')
    };

    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    return (<div
        data-disabled={disabledState}
        style={{
            width: width - 5,
            height,
            display: visibility ? '' : 'none',
        }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : null}
        >
            <Radio.Group
                onChange={onChange}
                value={defaultSelectKey}
                optionType={radioType}
                size={buttonSize}
            >
                {
                    datas.map((item, index) => (
                        <Radio
                            value={item.value}
                        >
                            {item.label}
                        </Radio>
                    ))
                }
            </Radio.Group>
        </ConfigProvider>
    </div>)
}