import React, { useState, useEffect, useRef } from 'react';
import * as Icon from '@ant-design/icons';
import { Menu } from 'antd';

export const NavMenu = function NavMenu({
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
    const [menuData, setMenuData] = useState(properties.menuData);
    const [defaultOpenKeys, setDefaultOpenKeys] = useState(properties.defaultOpenKeys);
    const [openKeys, setOpenKeys] = useState(properties.defaultOpenKeys);
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState(properties.defaultSelectedKeys);
    const [rootSubmenuKeys, setRootSubmenuKeys] = useState([]);
    const [inlineCollapsed, setInlineCollapsed] = useState(properties.defaultinlineCollapsed);
    const [menuMode, setMenuMode] = useState(properties.menuMode);
    const [onlyOpenOne, setOnlyOpenOne] = useState(properties.onlyOpenOne);


    useEffect(() => {
        if (Array.isArray(properties.menuData)) {
            const result = properties.menuData.filter((item) => item.children).map((item) => item.key);
            setRootSubmenuKeys(result)
            setMenuData(HandleMenuList(properties.menuData))
        }
        else
            setMenuData([])
    }, [properties.menuData])

    useEffect(() => {
        setDefaultOpenKeys(properties.defaultOpenKeys)
    }, [properties.defaultOpenKeys])

    useEffect(() => {
        setDefaultSelectedKeys(properties.defaultSelectedKeys)
    }, [properties.defaultSelectedKeys])

    useEffect(() => {
        setOnlyOpenOne(properties.onlyOpenOne)
    }, [properties.onlyOpenOne])

    useEffect(() => {
        setInlineCollapsed(properties.defaultinlineCollapsed)
    }, [properties.defaultinlineCollapsed])

    useEffect(() => {
        console.log('properties.menuMode', properties.menuMode)
        setMenuMode(properties.menuMode)
    }, [properties.menuMode])

    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    registerAction(
        'setInlineCollapsed',
        async function (status) {
            setExposedVariable('InlineCollapsed', status)
            if (status === '')
                setInlineCollapsed(!inlineCollapsed)
            else
                setInlineCollapsed(status)
        },
        [inlineCollapsed]
    );

    // 渲染图标
    const HandleMenuList = (menuList) => {
        return menuList.map(v => {
            if (v?.icon) {
                const icon = React.createElement(
                    Icon[v.icon]
                )
                return v?.children ? {
                    ...v,
                    children: HandleMenuList(v.children),
                    icon: icon
                } : { ...v, icon: icon }
            } else {
                return v?.children ? {
                    ...v,
                    children: HandleMenuList(v.children),
                } : v
            }

        })
    }


    const onClick = (e) => {
        console.log(e);
        setExposedVariable('currentKey', e.key)
        setExposedVariable('currentPath', e.keyPath)
        fireEvent('onClick')
    };

    const onOpenChange = (keys) => {
        if (onlyOpenOne) {
            const latestOpenKey = keys.find((key) => openKeys.indexOf(key) === -1);
            if (rootSubmenuKeys.indexOf(latestOpenKey) === -1) {
                setOpenKeys(keys);
            } else {
                setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
            }
        } else {
            setOpenKeys(keys)
        }
    };

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <Menu
            onClick={onClick}
            theme={darkMode ? "dark" : "light"} items={menuData}
            onOpenChange={onOpenChange}
            defaultOpenKeys={defaultOpenKeys}
            defaultSelectedKeys={defaultSelectedKeys}
            mode={menuMode}
            openKeys={openKeys}
            inlineCollapsed={inlineCollapsed}
        />
    </div>)
}