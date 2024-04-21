import React, { useState, useEffect, useRef } from 'react';
import { Transfer } from 'antd';
import { theme, ConfigProvider } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
import zhCN from 'antd/locale/zh_CN';


export const Transfers = function Transfers({
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

    const [datas, setDatas] = useState();
    const [datas2, setDatas2] = useState(properties.datas2);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [titles, setTitles] = useState(properties.titles);
    const [oneWay, setOneWay] = useState(properties.oneWay);
    const [pagination, setPagination] = useState(properties.pagination);
    const [showSearch, setShowSearch] = useState(properties.showSearch);

    const [pageSize, setPageSize] = useState(properties.pageSize);
    const [color, setColor] = useState(styles.color);
    const [colorbg, setColorbg] = useState(styles.colorbg);
    useEffect(() => {
        if (Array.isArray(properties.datas)) {
            setDatas(properties.datas)
        } else {
            setDatas([])
        }
    }, [properties.datas])

    useEffect(() => {
        setExposedVariable('targetKeys', datas2);
    }, [datas2])

    useEffect(() => {
        setTitles(properties.titles)
    }, [properties.titles])

    useEffect(() => setOneWay(properties.oneWay), [properties.oneWay])
    useEffect(() => setShowSearch(properties.showSearch), [properties.showSearch])
    useEffect(() => { setPageSize(properties.pageSize) }, [properties.pageSize])
    useEffect(() => { setPagination(properties.pagination) }, [properties.pagination])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => {
        setColor(styles.color)
        setColorbg(styles.colorbg)
    }, [styles.color, styles.colorbg])

    // 过滤不存在的key
    const filterArr = (arr) => {
        let datasKeys = datas.map(x => x.key)
        return arr.filter(x => {
            return datasKeys.includes(x)
        })
    }

    // 注册自定义事件
    registerAction(
        'setTargetKeys',
        async function (keys) {
            setDatas2(filterArr(keys))
        },
        [datas]
    );
    registerAction(
        'setSourceSelectedKeys',
        async function (keys) {
            setSelectedKeys(filterArr(keys))
        },
        [datas]
    );

    const onChange = (nextTargetKeys, direction, moveKeys) => {
        // setExposedVariable('targetKeys', nextTargetKeys);
        setExposedVariable('direction', direction);
        setExposedVariable('movedKeys', moveKeys);
        setDatas2(nextTargetKeys);
        fireEvent('onChange')
    };
    const onSelectChange = (sourceSelectedKeys, targetSelectedKeys) => {
        setExposedVariable('sourceSelectedKeys', sourceSelectedKeys);
        setExposedVariable('targetSelectedKeys', targetSelectedKeys);
        setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
        fireEvent('onSelect')

    };
    const onSearch = (direction, value) => {
        setExposedVariable('direction', direction);
        setExposedVariable('searchText', value);
        fireEvent('onSearch')
    }

    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };


    return (<div data-disabled={disabledState} style={{
        width: width - 5,
        height,
        backgroundColor: darkMode ? '#232e3c' : color,
        display: visibility ? '' : 'none'
    }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                    colorBgContainer: colorbg,
                }
            }}
            locale={zhCN}
        >
            <Transfer
                listStyle={{
                    width: width,
                    height: height,
                }}
                showSearch={showSearch}
                dataSource={datas}
                titles={titles}
                targetKeys={datas2}
                selectedKeys={selectedKeys}
                onChange={onChange}
                onSelectChange={onSelectChange}
                render={(item) => item.title}
                oneWay={oneWay}
                onSearch={onSearch}
                pagination={pagination ? {
                    pageSize: pageSize || 10,
                } : pagination}
            />
        </ConfigProvider>
    </div>)
}