import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Popconfirm, Button } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
import * as Icons from '@ant-design/icons';

export const Popconfirms = function Popconfirms({
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

    const [title, setTitle] = useState(properties.title);
    const [open, setOpen] = useState(false);
    const [description, setDescription] = useState(properties.description);
    const [okText, setOkText] = useState(properties.okText);
    const [cancelText, setCancelText] = useState(properties.cancelText);
    const [ButtonText, setButtonText] = useState(properties.ButtonText);
    const [condition, setCondition] = useState(properties.condition);
    const [icon, setIcon] = useState(properties.icon);
    const [arrow, setArrow] = useState(properties.arrow);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [cancelButtonDisable, setCancelButtonDisable] = useState(false);
    const [closeWithFunc, setCloseWithFunc] = useState();
    // 样式
    const [buttonDanger, setButtonDanger] = useState(styles.buttonDanger);
    useEffect(() => { setTitle(properties.title) }, [properties.title])
    useEffect(() => { setDescription(properties.description) }, [properties.description])
    useEffect(() => { setOkText(properties.okText) }, [properties.okText])
    useEffect(() => { setCancelText(properties.cancelText) }, [properties.cancelText])
    useEffect(() => { setButtonText(properties.ButtonText) }, [properties.ButtonText])
    useEffect(() => { setCondition(properties.condition) }, [properties.condition])
    useEffect(() => {
        setCloseWithFunc(properties.closeWithFunc)
        if (!properties.closeWithFunc) {
            setConfirmLoading(false);
            setCancelButtonDisable(false);
        }
    }, [properties.closeWithFunc])
    useEffect(() => {
        setIcon(React.createElement(Icons[properties.icon], {
            style: { color: styles.iconColor },
        }))
    }, [properties.icon, styles.iconColor])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => { setButtonDanger(styles.buttonDanger) }, [styles.buttonDanger])
    useEffect(() => { setArrow(styles.arrow) }, [styles.arrow])

    // 注册自定义事件
    registerAction(
        'popConfirm',
        async function (status) {
            if (status === true)
                setOpen(true)
            else {
                setConfirmLoading(false);
                setTimeout(() => {
                    setOpen(false);
                    setCancelButtonDisable(false);
                }, 300);
            }
        },
        [setOpen, setConfirmLoading, setCancelButtonDisable]
    );

    registerAction(
        'close',
        async function (closePopWindow) {
            setCancelButtonDisable(false);
            setConfirmLoading(false);
            setTimeout(() => {
                if (closePopWindow === true)
                    setOpen(false)
            }, 300);
        },
        [setOpen, setConfirmLoading, setCancelButtonDisable]
    );

    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };
    const confirm = (e) => {
        if (closeWithFunc) {
            setConfirmLoading(true);
            setCancelButtonDisable(true);
        }
        fireEvent('onClick')

    };
    const cancel = (e) => {
        fireEvent('onCheck')
        setOpen(false);
    };

    const handleOpenChange = (newOpen) => {
        if (closeWithFunc && !newOpen) {
            return false;
        }
        if (!newOpen) {
            setOpen(newOpen);
            return;
        }
        if (!condition) {
            confirm();
        } else {
            setOpen(newOpen);
        }
    };

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
        >
            <Popconfirm
                open={open}
                title={title}
                description={description}
                onConfirm={confirm}
                onCancel={cancel}
                okText={okText}
                onOpenChange={handleOpenChange}
                cancelText={cancelText}
                placement={arrow}
                icon={icon}
                okButtonProps={{
                    loading: confirmLoading,
                }}
                cancelButtonProps={{
                    disabled: cancelButtonDisable,
                }}
            >
                <Button
                    danger={buttonDanger}
                    style={{ width: width - 5, height: height - 2 }}
                >{ButtonText}</Button>
            </Popconfirm>
        </ConfigProvider>
    </div>)
}