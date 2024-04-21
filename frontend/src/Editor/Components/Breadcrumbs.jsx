import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Breadcrumb } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
// 导入本地中文配置
// import zhCN from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

export const Breadcrumbs = function Breadcrumbs({
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

    const [items, setItems] = useState(properties.items);
    const [separator, setSeparator] = useState(properties.separator);

    // 样式
    const [backgroundColor, setBackgroundColor] = useState(styles.backgroundColor);
    const [TransBackground, setTransBackground] = useState(styles.TransBackground);

    useEffect(() => {
        if (Array.isArray(properties.items)) {
            setItems(properties.items.map((item, index) => {
                return {
                    ...item,
                    title: properties.items.length !== (index + 1) ? (<a onClick={() => {
                        setExposedVariable('clickedItem', item)
                        fireEvent('onClick')
                    }}>{item?.title}</a>) : item?.title,
                }
            }))
        }
        else {
            setItems([])
        }
    }, [properties.items])
    useEffect(() => { setSeparator(properties.separator) }, [properties.separator])
    //样式处理
    useEffect(() => { setBackgroundColor(styles.backgroundColor) }, [styles.backgroundColor])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setTransBackground(styles.TransBackground)
    }, [styles.visibility, styles.disabledState, styles.TransBackground])



    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };


    return (<div data-disabled={disabledState}
        style={{
            width: width - 5,
            height,
            display: visibility ? '' : 'none',
            backgroundColor: TransBackground ? 'transparent' : backgroundColor,
            paddingLeft: '5px',
            paddingTop: '3px',
        }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
        >
            <Breadcrumb
                separator={separator}
                items={items}
            >
            </Breadcrumb>
        </ConfigProvider>
    </div>)
}