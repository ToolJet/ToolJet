import React, { useState, useEffect, useRef } from 'react';
import { Button, Drawer, ConfigProvider } from 'antd';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { theme } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;

export const Drawers = function Drawers({
    id,
    width,
    height,
    component,
    darkMode,
    currentState,
    containerProps,
    onComponentOptionChanged,
    onComponentOptionsChanged,
    removeComponent,
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
    const [showButton, setShowButton] = useState(properties.showButton);
    const [popSize, setPopSize] = useState(properties.popSize);
    const [placement, setPlacement] = useState(properties.placement);
    const [title, setTitle] = useState(properties.title);
    const [buttonTitle, setButtonTitle] = useState(properties.buttonTitle);
    const [hiddenOnMouseOut, sethiddenOnMouseOut] = useState(properties.hiddenOnMouseOut);
    const [color, setColor] = useState(styles.color);
    const [open, setOpen] = useState();
    const [showDrawerBody, setShowDrawerBody] = useState();

    useEffect(() => {
        setShowButton(properties.showButton)
    }, [properties.showButton])
    useEffect(() => {
        setPopSize(properties.popSize)
    }, [properties.popSize])
    useEffect(() => {
        setPlacement(properties.placement)
    }, [properties.placement])
    useEffect(() => {
        sethiddenOnMouseOut(properties.hiddenOnMouseOut)
    }, [properties.hiddenOnMouseOut])
    useEffect(() => {
        setTitle(properties.title)
        setButtonTitle(properties.buttonTitle)
    }, [properties.title, properties.buttonTitle])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => {
        setColor(styles.color)
    }, [styles.color])

    // 注册自定义事件
    registerAction(
        'setStatus',
        async function (status) {
            setOpen(status)
        },
        []
    );

    const showDrawer = () => {
        setOpen(!open);
        fireEvent('onClick');
    };
    useEffect(() => {
        setExposedVariable('show', open)
        setTimeout(() => {
            setShowDrawerBody(open)
        }, 200);
    }, [open]);
    const onClose = () => {
        setOpen(false);
        fireEvent('onClose');
    };

    const parentRef = useRef(null);
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
        token: {
            paddingLG: 0,
        }
    };
    const handleOnBlur=()=>{
        hiddenOnMouseOut && containerProps.mode !== 'edit'  && setOpen(false);
    }

    return (<div
        data-disabled={disabledState}
    >
        {(containerProps.mode === 'edit' || showButton) && (<Button
            type="primary"
            onClick={showDrawer}
            style={{ width: width, height, display: visibility ? '' : 'none' }}
        >
            {buttonTitle}
        </Button>)}
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    paddingLG: 0,
                }
            }}
        >
            <Drawer
                title={title}
                onClose={onClose}
                className="jet-container"
                open={open}
                mask={containerProps.mode === 'edit' ? false : true}
                size={popSize}
                placement={(containerProps.mode === 'edit' && placement === 'right') ? 'left' : placement}
            >
                {showDrawerBody && (
                    <div
                        id={id}
                        ref={parentRef}
                        style={{
                            width: popSize === 'default' ? '378px' : '736px',
                        }}
                        onMouseLeave={handleOnBlur}
                    >
                        <SubContainer
                            parentComponent={component}
                            parent={id}
                            {...containerProps}
                            parentRef={parentRef}
                            removeComponent={removeComponent}
                            height={(placement === 'button' || placement === 'top') && popSize === 'default' ? '321px' : (placement === 'button' || placement === 'top') ? '679px' : '100%'}
                        />
                        <SubCustomDragLayer
                            parent={id}
                            parentRef={parentRef}
                            currentLayout={containerProps.currentLayout}
                        />
                    </div>)}

            </Drawer>
        </ConfigProvider>
    </div >)
}