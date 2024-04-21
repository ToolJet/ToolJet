import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, DatePicker } from 'antd';
const { RangePicker } = DatePicker;
const { darkAlgorithm, compactAlgorithm } = theme;
// 导入本地中文配置
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'antd/locale/zh_CN';


export const DatePickerPlus = function DatePickerPlus({
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

    const [endDefaultValue, setEndDefaultValue] = useState(properties.endDefaultValue);
    const [pickerType, setPickerType] = useState(properties.pickerType);
    const [showRangePicker, setShowRangePicker] = useState(properties.showRangePicker);
    const [showTime, setShowTime] = useState(properties.showTime);
    const [defaultValue, setDefaultValue] = useState(properties.defaultValue);
    const [format, setFormat] = useState(properties.format);
    const [showFormat, setShowFormat] = useState(properties.showFormat);

    // 样式
    const [bordered, setBordered] = useState(styles.bordered);

    useEffect(() => { setEndDefaultValue(properties.endDefaultValue) }, [properties.endDefaultValue])
    useEffect(() => { setShowRangePicker(properties.showRangePicker) }, [properties.showRangePicker])
    useEffect(() => { setShowTime(properties.showTime) }, [properties.showTime])
    useEffect(() => {
        setPickerType(properties.pickerType)
        if (typeof properties.format === 'object') {
            setFormat(properties.format)
            if (properties.format[properties.pickerType] !== undefined)
                if (showTime && properties.pickerType === 'date')
                    setShowFormat(properties.format[properties.pickerType] + properties.showTimeFormat)
                else
                    setShowFormat(properties.format[properties.pickerType])
            else
                setShowFormat('')
        } else {
            setDatas([])
        }
    }, [properties.format, properties.pickerType, properties.showTimeFormat])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => { setBordered(styles.bordered) }, [styles.bordered])

    const onChange = (date, dateString) => {
        setExposedVariable('dateString', dateString)
        setExposedVariable('date', date)
        fireEvent('onChange')
    };

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };


    return (<div style={{ height, display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
            locale={locale}
        >
            {showRangePicker ? (<RangePicker
                allowClear
                style={{ width: width - 3, height: height }}
                onChange={onChange}
                defaultValue={[dayjs(defaultValue, 'YYYY-MM-DD'), dayjs(endDefaultValue, 'YYYY-MM-DD')]}
                picker={pickerType}
                format={showFormat}
                showTime={showTime}
                disabled={disabledState}
                bordered={bordered}
            />) : (
                <DatePicker
                    allowClear
                    style={{ width: width - 3, height: height }}
                    onChange={onChange}
                    defaultValue={dayjs(defaultValue, 'YYYY-MM-DD')}
                    picker={pickerType}
                    format={showFormat}
                    showTime={showTime}
                    bordered={bordered}
                    disabled={disabledState}

                />)
            }
        </ConfigProvider>
    </div>)
}