import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Icon from '@ant-design/icons';
// antd 暗色主题计算
import { theme, ConfigProvider, Tree, Input } from 'antd';
const { Search } = Input;
const { darkAlgorithm, compactAlgorithm } = theme;


export const Trees = function Trees({
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
    const treeRef = useRef(null)
    const [searchValue, setSearchValue] = useState('');
    const [searchAllPY, setSearchAllPY] = useState(properties.searchAllPY);
    const [searchFirstPY, setSearchFirstPY] = useState(properties.searchFirstPY);
    const [showSearch, setShowSearch] = useState(properties.showSearch);
    const [dataList, setDataList] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState('');
    const [treeData, setTreeData] = useState(properties.treeData);
    const [placeholder, setPlaceholder] = useState(properties.placeholder);
    const [parentList, setParentList] = useState([]);
    const [checkable, setCheckable] = useState(properties.checkable);
    const [checkedKeys, setCheckedKeys] = useState();
    const [expandedKeys, setExpandedKeys] = useState();
    const [autoExpandParent, setAutoExpandParent] = useState(true);
    const [allItemsPath, setAllItemsPath] = useState();
    // 样式
    const [showLine, setShowLine] = useState(styles.showLine);
    const [showIcon, setShowIcon] = useState(styles.showIcon);
    const [blockNode, setBlockNode] = useState(styles.blockNode);

    useEffect(() => {
        setExpandedKeys(properties.defaultExpandedKeys)
        setCheckedKeys(properties.checkedKeys)
        setSelectedKeys([properties.defaultSelectKey])
        setExposedVariable('selectedKey', properties.defaultSelectKey)
        setExposedVariable('checkedKeys', properties.checkedKeys)
        setExposedVariable('expandedKeys', properties.defaultExpandedKeys);
    }, [])

    useEffect(() => { setSearchAllPY(properties.searchAllPY) }, [properties.searchAllPY])
    useEffect(() => { setSearchFirstPY(properties.searchFirstPY) }, [properties.searchFirstPY])

    useEffect(() => {
        if (Array.isArray(properties.treeData)) {
            setTreeData(properties.treeData)
            const allItemstemp = []
            const allItemsPathTemp = {}
            const parentNodeList = []
            const generateList = (data, path = []) => {
                for (let i = 0; i < data.length; i++) {
                    const node = data[i];
                    const { key } = node;
                    allItemstemp.push({
                        key,
                        title: node?.title,
                    });
                    allItemsPathTemp[key] = path
                    if (node.children) {
                        parentNodeList.push(node.key)
                        generateList(node.children, [...path, key]);
                    }
                }
            };
            generateList(properties.treeData)
            setParentList(parentNodeList)
            setDataList(allItemstemp)
            setAllItemsPath(allItemsPathTemp)
        } else {
            setTreeData([])
        }
    }, [properties.treeData])

    useEffect(() => {
        if (typeof (allItemsPath) === 'object') {
            setExposedVariable('selectedKeyPath', allItemsPath[selectedKeys[0]])
            setExposedVariable('checkedKeysPath', checkedKeys.map(x => allItemsPath[x]))
        }
    }, [JSON.stringify(allItemsPath)])


    useEffect(() => { setPlaceholder(properties.placeholder) }, [properties.placeholder])
    useEffect(() => {
        setShowSearch(properties.showSearch)
        if (!properties.showSearch) {
            setSearchValue('')
        }
    }, [properties.showSearch])
    useEffect(() => { setCheckable(properties.checkable) }, [properties.checkable])
    //样式处理
    useEffect(() => {
        setVisibility(styles.visibility)
        setDisabledState(styles.disabledState)
    }, [styles.visibility, styles.disabledState])
    useEffect(() => { setShowLine(styles.showLine) }, [styles.showLine])
    useEffect(() => { setShowIcon(styles.showIcon) }, [styles.showIcon])
    useEffect(() => { setBlockNode(styles.blockNode) }, [styles.blockNode])

    const treeDatas = useMemo(() => {
        const loop = (data) =>
            data.map((item) => {
                const strTitle = item.title;
                const index = strTitle.indexOf(searchValue);
                const beforeStr = strTitle.substring(0, index);
                const afterStr = strTitle.slice(index + searchValue.length);
                const title =
                    index > -1 ? (
                        <span>
                            {beforeStr}
                            <span style={{ color: 'red' }}>{searchValue}</span>
                            {afterStr}
                        </span>
                    ) : (
                        <span>{strTitle}</span>
                    );
                const icon = item?.icon ? (
                    React.createElement(
                        Icon[item.icon]
                    )
                ) : null;

                if (item.children) {
                    return {
                        ...item,
                        title: title,
                        key: item.key,
                        icon: icon,
                        children: loop(item.children),
                    };
                } else {
                    return {
                        ...item,
                        title: title,
                        key: item.key,
                        icon: icon,
                    };
                }

            });
        return loop(treeData);
    }, [searchValue, properties.treeData]);

    registerAction(
        'setSelectKey',
        async function (key) {
            if (typeof key === 'string' && allItemsPath[key]) {
                setSelectedKeys([key])
                setExposedVariable('selectedKey', key)
                setExposedVariable('selectedKeyPath', allItemsPath[key])
            }
        },
        [selectedKeys]
    );

    registerAction(
        'setCheckKeys',
        async function (keys) {
            if (Array.isArray(keys)) {
                setCheckedKeys(keys)
                setExposedVariable('checkedKeys', keys)
            }
        },
        [checkedKeys]
    );

    registerAction(
        'expandAll',
        async function (status) {
            if (status === true) {
                setExpandedKeys(parentList)
                setExposedVariable('expandedKeys', parentList);
            }
            else {
                setExpandedKeys([])
                setExposedVariable('expandedKeys', []);
            }
        },
        [parentList]
    );

    registerAction(
        'scrollTo',
        async function (key) {
            setExpandedKeys(parentList)
            setExposedVariable('expandedKeys', parentList);
            setTimeout(() => {
                treeRef.current.scrollTo({ key })
            }, 200);
        },
        [parentList]
    );

    registerAction(
        'expandKeys',
        async function (keys) {
            if (Array.isArray(keys)) {
                setExpandedKeys(keys)
                setExposedVariable('expandedKeys', keys)
            }
        },
        [setExpandedKeys]
    );


    // 计算暗色主题
    const darkTheme = {
        algorithm: [darkAlgorithm, compactAlgorithm],
    };

    const getParentKey = (value, tree) => {
        let parentKey;
        for (let i = 0; i < tree.length; i++) {
            const node = tree[i];
            if (node.children) {
                if (node.children.some((item) => item.key === value)) {
                    parentKey = node.key;
                } else if (getParentKey(value, node.children)) {
                    parentKey = getParentKey(value, node.children);
                }
            }
        }
        return parentKey;
    };

    const onExpand = (expandedKeysValue) => {
        setExpandedKeys(expandedKeysValue);
        setExposedVariable('expandedKeys', expandedKeysValue);
        setAutoExpandParent(true);
    };

    const onSelect = (selectedKeys, info) => {
        setSelectedKeys(selectedKeys)
        setExposedVariable('selectedKey', selectedKeys[0])
        setExposedVariable('selectedKeyPath', allItemsPath[selectedKeys[0]])
        fireEvent('onSelect')
    };
    const onCheck = (checkedKeys, info) => {
        setCheckedKeys(checkedKeys);
        setExposedVariable('checkedKeys', checkedKeys)
        setExposedVariable('checkedKeysPath', checkedKeys.map(x => allItemsPath[x]))
        fireEvent('onChange')
    };

    const onSearch = (e) => {
        const { value } = e.target;
        const newExpandedKeys = dataList
            .map((item) => {
                if (item.title.indexOf(value) > -1 ||
                    (searchAllPY && item.title.spell().toLowerCase().indexOf(value.toLowerCase()) > -1) ||
                    (searchFirstPY && item.title.spell('first').toLowerCase().indexOf(value.toLowerCase()) > -1)
                ) {
                    return getParentKey(item.key, treeData);
                }
                return null;
            })
            .filter((item, i, self) => item && self.indexOf(item) === i);
        setExpandedKeys(newExpandedKeys);
        setSearchValue(value);
        setAutoExpandParent(true);
    };

    return (<div data-disabled={disabledState} style={{ width: width - 5, height, display: visibility ? '' : 'none' }}>
        <ConfigProvider
            theme={darkMode ? darkTheme : {
                token: {
                }
            }}
        >
            {showSearch ? <Search
                style={{
                    marginBottom: 2,
                }}
                placeholder={placeholder}
                onChange={onSearch}
                allowClear
            /> : ''}
            <Tree
                showIcon={showIcon}
                showLine={showLine}
                checkable={checkable}
                blockNode={blockNode}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                checkedKeys={checkedKeys}
                autoExpandParent={autoExpandParent}
                onSelect={onSelect}
                onCheck={onCheck}
                treeData={treeDatas}
                onExpand={onExpand}
                style={{ height: showSearch ? height - 33 : height }}
                height={showSearch ? height - 33 : height}
                ref={treeRef}
            ></Tree>
        </ConfigProvider>
    </div>)
}