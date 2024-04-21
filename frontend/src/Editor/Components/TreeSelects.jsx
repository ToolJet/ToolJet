import React, { useState, useEffect, useRef } from 'react';
// antd 暗色主题计算
import { theme, ConfigProvider, TreeSelect } from 'antd';
const { darkAlgorithm, compactAlgorithm } = theme;
// 导入本地中文配置
import zhCN from 'antd/locale/zh_CN';
// import dayjs from 'dayjs';

export const TreeSelects = function TreeSelects({
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

    const [datas, setDatas] = useState(properties.datas);
    const [defaultValue, setDefaultValue] = useState(properties.defaultValue);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [multiple, setMultiple] = useState(properties.multiple);
    const [searchValue, seSearchValue] = useState(properties.searchValue);
    const [searchFullPY, setSearchFullPY] = useState(properties.searchFullPY);
    const [searchFirstPY, setSearchFirstPY] = useState(properties.searchFirstPY);
    // 样式
    const [treeLine, setTreeLine] = useState(styles.treeLine);
    const [bordered, setBordered] = useState(styles.bordered);
    const [maxHeight, setMaxHeight] = useState(styles.maxHeight);

    useEffect(() => {
        if (Array.isArray(properties.datas)) {
            setDatas(properties.datas)
        } else {
            setDatas([])
        }
    }, [properties.datas])
    useEffect(() => { setPlaceholder(properties.placeholder) }, [properties.placeholder])
    useEffect(() => { 
        setDefaultValue(properties.defaultValue)
        setExposedVariable('selected', properties.defaultValue)
     }, [defaultValue])
    useEffect(() => { setMultiple(properties.multiple) }, [properties.multiple])
    useEffect(() => { seSearchValue(properties.searchValue) }, [properties.searchValue])
    useEffect(() => { setSearchFullPY(properties.searchFullPY) }, [properties.searchFullPY])
    useEffect(() => { setSearchFirstPY(properties.searchFirstPY) }, [properties.searchFirstPY])
    //样式处理
    useEffect(() => { setTreeLine(styles.treeLine) }, [styles.treeLine])
    useEffect(() => { setBordered(styles.bordered) }, [styles.bordered])
    useEffect(() => { setMaxHeight(styles.maxHeight) }, [styles.maxHeight])
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])

    registerAction(
        'setValue',
        async function (values) {
            if (Array.isArray(values)) {
                setValue(values)
                setExposedVariable('selected', values)
            } else {
                setValue([])
                setExposedVariable('selected', [])
            }
        },
        [setValue]
    );
    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    const [value, setValue] = useState();
    const onChange = (newValue) => {
        setValue(newValue);
        setExposedVariable('selected', newValue)
        fireEvent('onChange')
    };

    const onSearch = (searchValue) => {
        fireEvent('onSearch')
        console.log(searchValue);
    }

    const handelFilter = (inputValue, treeNode) => {
        if (treeNode?.value.indexOf(inputValue) >= 0 ||
            (searchFullPY && treeNode?.value.spell().toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) ||
            (searchFirstPY && treeNode?.value.spell('first').toLowerCase().indexOf(inputValue.toLowerCase()) >= 0)
        ) return true
        if (searchValue && (treeNode?.title.indexOf(inputValue) >= 0 ||
            (searchFullPY && treeNode?.title.spell().toLowerCase().indexOf(inputValue.toLowerCase()) >= 0) ||
            (searchFirstPY && treeNode?.title.spell('first').toLowerCase().indexOf(inputValue.toLowerCase()) >= 0)
        )) return true
    }

    return (
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
            locale={zhCN}
        >
            <TreeSelect
                disabled={disabledState}
                showSearch={true}
                style={{
                    width: '100%',
                    height: '100%',
                    display: visibility ? '' : 'none',
                }}
                value={value}
                dropdownStyle={{
                    maxHeight: maxHeight,
                    overflow: 'auto',
                }}
                placeholder={placeholder}
                allowClear
                treeCheckable={multiple}
                multiple={multiple}
                treeDefaultExpandAll
                onChange={onChange}
                treeData={datas}
                treeLine={treeLine}
                bordered={bordered}
                onSearch={onSearch}
                filterTreeNode={handelFilter}
                defaultValue={defaultValue}
            />
        </ConfigProvider>)
}