import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, Button, Layout, Menu, Avatar, Breadcrumb, space } from 'antd';
import * as Icons from '@ant-design/icons';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import _ from 'lodash';
const { Header, Sider, Content } = Layout;
const { darkAlgorithm, compactAlgorithm } = theme;
// 导入本地中文配置
import zhCN from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

export const Framework = function Framework({
    id,
    width,
    height,
    component,
    darkMode,
    currentState,
    onComponentOptionChanged,
    containerProps,
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

    var parentRef = useRef(null)
    var headerRef = useRef(null)
    // 菜单收缩状态
    const [collapsed, setCollapsed] = useState(false);
    // 菜单数据
    const [menuData, setMenuData] = useState([]);
    // 展开的菜单节点
    const [openKeys, setOpenKeys] = useState([]);
    // 全部菜单项目
    const [allMenuItems, setAllMenuItems] = useState([]);
    // 菜单标题与key的映射
    const [allMenukeyLabelMap, setAllMenukeyLabelMap] = useState([]);
    // const [currentPath, setCurrentPath] = useState([]);  
    const [BreadcrumbItems, setBreadcrumbItems] = useState([]);
    // 默认展开的菜单节点
    const [defaultSelectedKeys, setDefaultSelectedKeys] = useState(properties.defaultSelectedKeys);
    // 一级有子菜单的节点的key列表
    const [rootSubmenuKeys, setRootSubmenuKeys] = useState([]);
    // 只打开一个菜单节点
    const [onlyOpenOne, setOnlyOpenOne] = useState(properties.onlyOpenOne);
    const [logo, setLogo] = useState(properties.logo);
    const [title, setTitle] = useState(properties.title);
    // 当前选中的菜单
    const [currentKey, setCurrentKey] = useState(properties.currentKey);
    const [logoSRC, setLogoSRC] = useState(properties.logoSRC);




    // 样式
    const [bhColor, setBhColor] = useState(styles.bhColor);
    const [headerBHColor, setHeaderBHColor] = useState(styles.headerBHColor);
    const [titleFontSize, setTitleFontSize] = useState(styles.titleFontSize);
    // 初始化

    useEffect(() => {
        if (Array.isArray(properties.menuData)) {
            const result = properties.menuData.filter((item) => item.children).map((item) => item.key);
            setRootSubmenuKeys(result)
            let allItems = []
            let allKeyLabelMap = {}
            setMenuData(HandleMenuList(properties.menuData, allItems, allKeyLabelMap))
            setAllMenuItems(allItems)
            setAllMenukeyLabelMap(allKeyLabelMap)
        }
        else
            setMenuData([])
    }, [JSON.stringify(properties.menuData)])
    useEffect(() => { setLogoSRC(properties.logoSRC) }, [properties.logoSRC])
    useEffect(() => {
        setDefaultSelectedKeys(properties.defaultSelectedKeys)
        setBreadcrumbItems(getParentKey(properties.menuData, properties.defaultSelectedKeys, [], 'label', false).map(item => {
            return {
                title: item
            }
        }))
        setOpenKeys(getParentKey(properties.menuData, properties.defaultSelectedKeys, [], 'key', true))
        setCurrentKey(properties.defaultSelectedKeys)
    }, [properties.defaultSelectedKeys])
    useEffect(() => { setOnlyOpenOne(properties.onlyOpenOne) }, [properties.onlyOpenOne])
    useEffect(() => { setLogo(properties.logo) }, [properties.logo])
    useEffect(() => { setTitle(properties.title) }, [properties.title])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
        setTitleFontSize(styles.titleFontSize)
    }, [styles.visibility, styles.disabledState, styles.titleFontSize])

    useEffect(() => {
        setBhColor(styles.bhColor)
        setHeaderBHColor(styles.headerBHColor)
    }, [styles.bhColor, styles.headerBHColor])

    // 注册自定义事件
    registerAction(
        'clickItem',
        async function (key) {
            let currentPath = getParentKey(menuData, key, [], 'key')
            if (currentPath.length > 0) {
                setExposedVariable('currentKey', key)
                setExposedVariable('currentPath', currentPath)
                setCurrentKey(key)
                setOpenKeys(currentPath)
                setBreadcrumbItems(currentPath.map(item => {
                    return {
                        title: allMenukeyLabelMap[item]
                    }
                }))
            } else {
                console.log('未找到传入的key');
            }

        },
        [menuData, allMenukeyLabelMap]
    );
    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    // 只打开一个菜单的实现
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

    // 菜单列表递归渲染图标
    const HandleMenuList = (menuList, allItems = [], keyLabelMap = {}) => {
        return menuList.map((v) => {
            if (!v.children) allItems.push(v)
            keyLabelMap[v.key] = v.label
            if (v?.icon) {
                const icon = React.createElement(
                    Icons[v.icon]
                )
                return v?.children ? {
                    ...v,
                    children: HandleMenuList(v.children, allItems, keyLabelMap),
                    icon: icon
                } : { ...v, icon: icon }
            } else {
                return v?.children ? {
                    ...v,
                    children: HandleMenuList(v.children, allItems, keyLabelMap),
                } : v
            }
        })
    }
    // 获取父节点函数
    function getParentKey(data, key, path = [], retKey = 'label') {
        for (let item of data) {
            console.log('key', item['key']);
            if (item.key === key) {
                path.push(item[retKey]);
                return path;
            }
            if (item.children) {
                const childPath = item.type ? getParentKey(item.children, key, path, retKey) : getParentKey(item.children, key, [...path, item[retKey]], retKey);
                if (childPath.length > 0) {
                    return childPath;
                }
            }
        }
        return [];
    }

    // 点击菜单时
    const onClick = (e) => {
        setExposedVariable('currentKey', e.key)
        setExposedVariable('currentPath', e.keyPath)
        setCurrentKey(e.key)
        e.keyPath.reverse()
        setBreadcrumbItems(e.keyPath.map(item => {
            return {
                title: allMenukeyLabelMap[item]
            }
        }))
        fireEvent('onClick')
    };
    // 点击logo时
    const handleClickLOGO = () => {
        fireEvent('onCheck')
    }

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <div
            id={`${id}-header`}
            ref={headerRef}
            style={{
                position: 'absolute',
                marginRight: '2px',
                height: '64px',
                width: width - 300,
                right: '0px',
                'z-index': '100',
            }}
        >
            <div
                style={{
                    position: 'relative',
                }}
            >
                <SubContainer
                    parentComponent={component}
                    containerCanvasWidth={width - 300}
                    parent={`${id}-header`}
                    {...containerProps}
                    parentRef={headerRef}
                    removeComponent={removeComponent}
                    height='64px'
                />
                <SubCustomDragLayer
                    containerCanvasWidth={width - 300}
                    parent={`${id}-header`}
                    parentRef={headerRef}
                    currentLayout={containerProps.currentLayout}
                />
            </div>
        </div>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
            locale={zhCN}
        >
            <Layout style={{ height }}>
                <Sider
                    style={{
                        overflow: 'auto',
                        height,
                    }}
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                >
                    <div style={{
                        height: '64px',
                        'display': 'flex',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'height': '80px',
                        'cursor': 'pointer',
                    }}
                        onClick={handleClickLOGO}
                    >
                        <Avatar
                            size={32}
                            icon={React.createElement(Icons[logo])}
                            src={logoSRC}
                            shape='square'
                            style={{
                                fontSize: '32px'
                            }}
                        />
                        <span style={{
                            color: '#fff',
                            'font-weight': 700,
                            'font-size': titleFontSize + 'px',
                            'margin-left': '10px',
                            'white-space': 'nowrap',
                            display: collapsed ? 'none' : ''
                        }}>{title}</span>
                    </div>
                    <Menu
                        theme="dark"
                        mode="inline"
                        onOpenChange={onOpenChange}
                        defaultSelectedKeys={defaultSelectedKeys}
                        items={menuData}
                        openKeys={openKeys}
                        onClick={onClick}
                        selectedKeys={currentKey}
                    />
                </Sider>
                <Layout>
                    <Header
                        style={{
                            padding: 0,
                            background: headerBHColor,
                            position: 'relative',
                        }}
                    >
                        <Button
                            type="text"
                            icon={collapsed ? React.createElement(Icons['MenuUnfoldOutlined']) : React.createElement(Icons['MenuFoldOutlined'])}
                            onClick={() => setTimeout(() => {
                                setCollapsed(!collapsed)
                                setExposedVariable('collapsed', collapsed)
                            }, 100)}
                            style={{
                                fontSize: '16px',
                                width: 40,
                                height: 40,
                            }}
                        />

                        <div
                            className={`jet-container`}
                            style={{
                                height: '40px',
                                width: '100%',
                                height: 40,
                            }}
                            onClick={(e) => {
                                if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
                            }}
                        >
                        </div>
                    </Header>
                    <Content>
                        <Breadcrumb
                            style={{
                                marginLeft: '16px',
                                marginBottom: '8px',
                                marginTop: '8px',
                            }}
                            items={BreadcrumbItems}
                        >
                        </Breadcrumb>
                        {allMenuItems.map((item) => {
                            if (item.key === currentKey) {
                                return (
                                    <div
                                        data-disabled={disabledState}
                                        className={`jet-container ${properties.loadingState && 'jet-container-loading'}`}
                                        id={`${id}-${item.key}`}
                                        ref={(newCurrent) => {
                                            if (currentKey === item.key) {
                                                parentRef.current = newCurrent;
                                            }
                                        }}
                                        style={{
                                            height: height - 64 - 55,
                                            position: 'relative',
                                            background: bhColor,
                                            width: width - (collapsed ? 85 : 205),
                                            height: height - 102,
                                        }}
                                        onClick={(e) => {
                                            if (e.target.className === 'real-canvas') containerProps.onComponentClick(id, component);
                                        }}
                                    >
                                        <SubContainer
                                            parentComponent={component}
                                            containerCanvasWidth={width - (collapsed ? 85 : 205)}
                                            parent={`${id}-${item.key}`}
                                            {...containerProps}
                                            parentRef={parentRef}
                                            removeComponent={removeComponent}
                                        />
                                        <SubCustomDragLayer
                                            containerCanvasWidth={width - (collapsed ? 85 : 205)}
                                            parent={`${id}-${item.key}`}
                                            parentRef={parentRef}
                                            currentLayout={containerProps.currentLayout}
                                        />
                                    </div>)
                            }
                        })}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    </div >)
}