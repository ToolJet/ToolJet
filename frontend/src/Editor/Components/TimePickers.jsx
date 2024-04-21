import React, { useState, useEffect, useRef } from 'react';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import moment from 'moment'
// antd 暗色主题计算
import { theme, ConfigProvider, TimePicker } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const TimePickers = function TimePickers({
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

    const [value, setValue] = useState();
    const [datas, setDatas] = useState(properties.datas);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [defaultValue, setDefaultValue] = useState(properties.defaultValue);
    const [timeStep, setTimeStep] = useState(properties.timeStep);
    const [changeOnBlur, setChangeOnBlur] = useState(properties.changeOnBlur);
    const [timeFormat, setTimeFormat] = useState(properties.timeFormat);
    const [rangePicker, setRangePicker] = useState(properties.rangePicker);
    // 样式
    const [bordered, setBordered] = useState(styles.bordered);

    useEffect(() => {
        if (Array.isArray(properties.menuData)) {
            setDatas(properties.datas)
        } else {
            setDatas([])
        }
    }, [properties.datas])
    useEffect(() => { setChangeOnBlur(properties.changeOnBlur) }, [properties.changeOnBlur])
    useEffect(() => { setRangePicker(properties.rangePicker) }, [properties.rangePicker])
    useEffect(() => { setPlaceholder(properties.placeholder) }, [properties.placeholder])
    useEffect(() => {
        if (Array.isArray(properties.timeStep) && properties.timeStep.length === 3) {
            setTimeStep(properties.timeStep)
        } else {
            setTimeStep([1, 1, 1])
        }
    }, [properties.timeStep])
    useEffect(() => { setTimeFormat(properties.timeFormat) }, [properties.timeFormat])
    useEffect(() => {
        if (defaultValue) {
            setExposedVariable('time', defaultValue)
            setExposedVariable('timeObject', dayjs(defaultValue, timeFormat))
        } else {
            setExposedVariable('time', '')
            setExposedVariable('timeObject', null)
        }
    }, [defaultValue])
    //样式处理
    useEffect(() => { setBordered(styles.bordered) }, [styles.bordered])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])


    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    const onChange = (time, timeString) => {
        setValue(time);
        setExposedVariable('time', timeString)
        setExposedVariable('timeObject', time)
        fireEvent('onChange')
    };

    return (
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    controlHeight: height,
                }
            }}
            locale={zhCN}
        >{
                rangePicker ?
                    (<TimePicker.RangePicker
                        disabled={disabledState}
                        style={{
                            width: width - 5,
                            display: visibility ? '' : 'none',
                        }}
                        onChange={onChange}
                        format={timeFormat}
                        value={value}
                        defaultValue={defaultValue ? dayjs(defaultValue, 'HH:mm:ss') : null}
                        hourStep={timeStep[0]}
                        minuteStep={timeStep[1]}
                        secondStep={timeStep[2]}
                        changeOnBlur={changeOnBlur}
                        bordered={!bordered}
                    />) : (
                        <TimePicker
                            disabled={disabledState}
                            style={{
                                width: width - 5,
                                display: visibility ? '' : 'none',
                            }}
                            onChange={onChange}
                            format={timeFormat}
                            value={value}
                            defaultValue={defaultValue ? dayjs(defaultValue, 'HH:mm:ss') : null}
                            hourStep={timeStep[0]}
                            minuteStep={timeStep[1]}
                            secondStep={timeStep[2]}
                            changeOnBlur={changeOnBlur}
                            bordered={!bordered}
                            placeholder={placeholder}
                        />
                    )
            }

        </ConfigProvider>

    )
}