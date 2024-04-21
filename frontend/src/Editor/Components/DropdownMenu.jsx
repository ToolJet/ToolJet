import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Dropdown, Avatar } from 'antd';
import * as Icon from '@ant-design/icons';
const { darkAlgorithm, compactAlgorithm } = theme;
// 导入本地中文配置
// import zhCN from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

export const DropdownMenu = function DropdownMenu({
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
    const renderIcon = (menuList) => {
        return menuList.map(v => {
            if (v?.icon) {
                const icon = React.createElement(
                    Icon[v.icon]
                )
                return { ...v, icon: icon }
            } else {
                return v
            }
        })
    }

    const [visibility, setVisibility] = useState(styles.visibility);
    const [disabledState, setDisabledState] = useState(styles.disabledState);

    const [buttonTitle, setButtonTitle] = useState(properties.buttonTitle);
    const [items, setItems] = useState();
    const [buttonStatus, setButtonStatus] = useState(properties.buttonStatus);
    const [dropDownStatus, setDropDownStatus] = useState(properties.dropDownStatus);
    const [dropDownIcon, setDropDownIcon] = useState();
    const [trigger, setTrigger] = useState(properties.trigger);

    // 样式
    const [buttonType, setButtonType] = useState(styles.buttonType);
    const [placement, setPlacement] = useState(styles.placement);

    useEffect(() => { setButtonTitle(properties.buttonTitle) }, [properties.buttonTitle])
    useEffect(() => {
        setItems(renderIcon(properties.items))
    }, [properties.items])
    useEffect(() => { setButtonStatus(properties.buttonStatus) }, [properties.buttonStatus])
    useEffect(() => { setDropDownStatus(properties.dropDownStatus) }, [properties.dropDownStatus])
    useEffect(() => {
        setDropDownIcon(() => (
            React.createElement(Avatar, {
                src: properties.dropDownIconSrc,
                size: height * 0.7,
                shape: properties.shape,
                style: {
                    backgroundColor: styles.iconBHColor,
                    color: styles.iconColor,
                },
                icon: properties.dropDownIconText === '' ? React.createElement(Icon[properties.dropDownIcon], {
                    style: {
                        fontSize: height * 0.7,
                    }
                }) : ''
            }, [properties.dropDownIconText])
        ))
    }, [height, properties.dropDownIconText, properties.dropDownIconSrc, properties.dropDownIcon, properties.shape, styles.iconColor, styles.iconBHColor])

    useEffect(() => { setTrigger(properties.trigger) }, [properties.trigger])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => { setButtonType(styles.buttonType) }, [styles.buttonType])
    useEffect(() => { setPlacement(styles.placement) }, [styles.placement])

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
        token: {
            controlHeight: height,
        }
    };

    const handleButtonClick = (e) => {
        fireEvent('onClick')
    };
    const handleMenuClick = (e) => {
        setExposedVariable('clickedMenu', e.key)
        fireEvent('onCheck')
        console.log('click', e);
    };

    return visibility ? (
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    controlHeight: height,
                }
            }}
        >
            <Dropdown.Button
                disabled={disabledState}
                type={buttonType}
                loading={buttonStatus}
                placement={placement}
                menu={{
                    items,
                    onClick: handleMenuClick,
                }}
                icon={dropDownIcon}
                trigger={[trigger]}
                onClick={handleButtonClick}
                buttonsRender={([leftButton, rightButton]) => [
                    leftButton,
                    React.cloneElement(rightButton, {
                        loading: dropDownStatus,
                        className: 'p-1',
                    }),
                ]}
            >
                {buttonTitle}
            </Dropdown.Button>
        </ConfigProvider>
    ) : ''
}