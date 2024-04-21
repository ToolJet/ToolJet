import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { ConfigProvider, Avatar, Badge } from 'antd';
import * as Icons from '@ant-design/icons';
// 导入本地中文配置
// import zhCN from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

export const Avatars = function Avatars({
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

    const [shape, setShape] = useState(properties.shape);
    const [title, setTitle] = useState(properties.title);
    // TODO：antd图标选择框
    const [icon, setIcon] = useState(properties.icon);
    const [src, setSrc] = useState(properties.src);
    const [counts, setCounts] = useState(properties.counts);
    // 样式
    const [color, setColor] = useState(styles.color);
    const [TransBackground, setTransBackground] = useState(styles.TransBackground);
    const [cursorPointer, setCursorPointer] = useState(styles.cursorPointer);
    const [backgroundColor, setbackgroundColo] = useState(styles.backgroundColor);

    useEffect(() => { setShape(properties.shape) }, [properties.shape])
    useEffect(() => {
        setTitle(properties.title)
    }, [properties.title])
    useEffect(() => { setSrc(properties.src) }, [properties.src])
    useEffect(() => { setIcon(properties.icon) }, [properties.icon])
    useEffect(() => { setCounts(properties.counts) }, [properties.counts])
    //样式处理
    useEffect(() => { setColor(styles.color); setbackgroundColo(styles.backgroundColor); }, [styles.color, styles.backgroundColor])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setCursorPointer(styles.cursorPointer)
        setTransBackground(styles.TransBackground)
    }, [styles.visibility, styles.disabledState, styles.cursorPointer, styles.TransBackground])


    // 处理点击事件
    const handleClick = () => {
        // 触发事件
        fireEvent('onClick');
    }

    // 渲染图标
    const renderIcon = (icon) => {
        if (icon in Icons)
            return React.createElement(Icons[icon])
        else
            return null
    }

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ConfigProvider>
            <Badge
                count={counts > 0 && shape !== 'circle' ? counts : null}
                dot={(counts ===0 && shape !== 'circle') ? true : false}
            >
                <Avatar
                    size={width < height ? width - 5 : height}
                    icon={title !== '' ? null : renderIcon(icon)}
                    shape={shape}
                    style={{
                        backgroundColor: TransBackground ? 'transparent' : backgroundColor,
                        color: color,
                        cursor: cursorPointer ? 'pointer' : '',
                    }}
                    src={src}
                    onClick={handleClick}
                >{title}
                </Avatar>
            </Badge>
        </ConfigProvider>
    </div>)
}