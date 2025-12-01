import React, { useState, useEffect } from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import Select from '@/_ui/Select';
import { dataqueryService } from '@/_services';
import { get } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

import { shallow } from 'zustand/shallow';
import FxButton from '@/Editor/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { debounce } from 'lodash';

const DynamicSelector = ({
    operation,
    dependsOn = [],
    selectedDataSource,
    currentAppEnvironmentId = "",
    optionsChanged,
    options = {},
    label,
    description,
    disabled = false,
    computeSelectStyles,
    disableMenuPortal = false,
    queryName,
    propertyKey,
    value,
    fxEnabled = true
}) => {
    console.log("fxEnabled", fxEnabled);

    const isDependent = dependsOn?.length > 0;

    const currentUser = useStore((state) => state.user);

    const opLabel = operation?.label || operation?.name || 'Fetch';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const isDynamicValue = (val) => typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}');
    const [isFxMode, setIsFxMode] = useState(fxEnabled && (isDynamicValue(options[propertyKey]?.value) || isDynamicValue(value)));

    useEffect(() => {
        if (fxEnabled) {
            const val = options[propertyKey]?.value ?? value;
            if (isDynamicValue(val) && !isFxMode) {
                setIsFxMode(true);
            }
        }
    }, [options, propertyKey, value, fxEnabled]);

    const depKeys = Array.isArray(dependsOn) ? dependsOn : [];
    const depValues = Object.fromEntries(depKeys.map(k => [k, options?.[k]?.value ?? options?.[k]]));
    const depsReady = depKeys.length === 0 || depKeys.every(k => {
        const v = options?.[k]?.value ?? options?.[k];
        return v !== undefined && v !== null && v !== '';
    });

    const [fetchedData, setFetchedData] = useState([]);
    const invokeMethod = operation?.invokeMethod || operation?.invoke_method;

    // Use zustand/shallow to avoid unnecessary re-renders
    const dependencyValues = useStore((state) => {
        if (!isDependent) return {};
        const queryOptions = state.queryPanel.selectedQuery?.options || {};
        return depKeys.reduce((acc, key) => {
            acc[key] = queryOptions[key];
            return acc;
        }, {});
    }, shallow);

    const compositeDependencyKey = Object.values(dependencyValues).join('_');

    const handleFetch = async (isAutoFetch = false) => {
        if (!selectedDataSource?.id || !invokeMethod) {
            console.error('[DynamicSelector] Missing data source or invoke method', { selectedDataSourceId: selectedDataSource?.id, invokeMethod });
            setError('Configuration error: missing data source or invoke method');
            return;
        }

        const environmentId = currentAppEnvironmentId != null ? String(currentAppEnvironmentId) : '';

        setIsLoading(true);
        setError(null);

        try {
            const args = depKeys.length ? { values: depValues } : undefined;
            const response = await dataqueryService.invoke(
                selectedDataSource.id,
                invokeMethod,
                environmentId,
                args
            );

            const payload = response?.data ?? response;

            let items = [];
            if (Array.isArray(payload?.data)) {
                items = payload.data;
            } else if (Array.isArray(payload)) {
                items = payload;
            } else if (payload && Array.isArray(payload?.result)) {
                items = payload.result;
            }

            const transformedData = items.map(it => {
                const key = it?.key ?? it?.id ?? it?.value;
                const labelText = it?.label ?? it?.value ?? String(key);
                const valueForSelect = key;
                return {
                    value: valueForSelect,
                    label: labelText,
                    meta: it
                };
            });

            setFetchedData(transformedData);

            if (isDependent) {
                // Store in cache based on dependency value
                const cacheKey = `${propertyKey}_cache`;
                const existingCache = get(options, cacheKey) || {};

                const parentKey = compositeDependencyKey;
                const parentValue = compositeDependencyKey;

                const isMultiAuth = !!selectedDataSource?.options?.multiple_auth_enabled;
                const userId = currentUser?.id;

                let newCache = { ...existingCache };

                // Invalidate cache if auth mode changed
                if (existingCache.isMultiAuth !== undefined && existingCache.isMultiAuth !== isMultiAuth) {
                    newCache = {};
                }

                newCache.isMultiAuth = isMultiAuth;

                if (isMultiAuth) {
                    if (!userId) {
                        console.warn('[DynamicSelector] Multi-user auth enabled but no user ID found, skipping cache update');
                    } else {
                        // Replace the user's cache with the new data, discarding previous dependency values
                        newCache[userId] = {
                            [parentValue]: transformedData
                        };
                    }
                } else {
                    newCache = {
                        isMultiAuth: isMultiAuth,
                        [parentValue]: transformedData
                    };
                }

                const updatedOptions = {
                    ...options,
                    [cacheKey]: newCache
                };
                optionsChanged(updatedOptions);
            } else {
                const cacheKey = `${propertyKey}_cache`;
                const existingCache = get(options, cacheKey) || {};
                const isMultiAuth = !!selectedDataSource?.options?.multiple_auth_enabled;
                const userId = currentUser?.id;

                let newCache = { ...existingCache };

                if (existingCache.isMultiAuth !== undefined && existingCache.isMultiAuth !== isMultiAuth) {
                    newCache = {};
                }
                newCache.isMultiAuth = isMultiAuth;

                if (isMultiAuth) {
                    if (userId) {
                        newCache[userId] = {
                            '__default': transformedData
                        };
                    }
                } else {
                    newCache = {
                        isMultiAuth: isMultiAuth,
                        '__default': transformedData
                    };
                }

                const updatedOptions = {
                    ...options,
                    [cacheKey]: newCache
                };

                optionsChanged(updatedOptions);
            }


        } catch (err) {
            console.error(`[DynamicSelector] Error fetching data for ${invokeMethod}:`, err);
            setError(err?.message || 'Failed to fetch data');

            // bubble oauth unauthorized message detection
            if (err?.message?.includes('OAuthUnauthorizedClientError') || err?.status === 401) {
                // Let UI handle re-auth flow; show specific message
                setError('Authentication expired. Please re-authenticate the data source.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Check queryOptions for cached value on mount
    useEffect(() => {
        if (!selectedDataSource || !selectedDataSource.options) return;

        const storedValue = get(options, propertyKey);
        if (storedValue) {
            console.log(`[DynamicSelector] Found stored value for ${propertyKey}:`, storedValue);

            // Check if the component depends on other fields, if yes then update the cache

            if (isDependent) {
                const cacheKey = `${propertyKey}_cache`;
                const existingCache = get(options, cacheKey) || {};

                const parentKey = compositeDependencyKey;
                const parentValue = compositeDependencyKey;

                const isMultiAuth = !!selectedDataSource?.options?.multiple_auth_enabled;
                const userId = currentUser?.id;

                // Validate cache mode
                if (existingCache.isMultiAuth !== undefined && existingCache.isMultiAuth !== isMultiAuth) {
                    handleFetch();
                    return;
                }

                let cachedData = null;
                if (isMultiAuth) {
                    if (userId && existingCache[userId]) {
                        cachedData = existingCache[userId][parentValue];
                    }
                } else {
                    cachedData = existingCache[parentValue];
                }

                if (!cachedData) {
                    // Fetch data for the current dependency state and store in cache
                    handleFetch()
                } else {
                    setFetchedData(cachedData);
                }
            } else {
                const cacheKey = `${propertyKey}_cache`;
                const existingCache = get(options, cacheKey) || {};

                const isMultiAuth = !!selectedDataSource?.options?.multiple_auth_enabled;
                const userId = currentUser?.id;

                if (existingCache.isMultiAuth !== undefined && existingCache.isMultiAuth !== isMultiAuth) {
                    handleFetch();
                    return;
                }

                let cachedData = null;
                if (isMultiAuth) {
                    if (userId && existingCache[userId]) {
                        cachedData = existingCache[userId]['__default'];
                    }
                } else {
                    cachedData = existingCache['__default'];
                }

                if (cachedData) {
                    setFetchedData(cachedData);
                }
            }
        }
    }, [selectedDataSource])


    // Watch for changes in dependency state
    useEffect(() => {
        if (isDependent && compositeDependencyKey && depsReady) {
            const cacheKey = `${propertyKey}_cache`;
            const existingCache = get(options, cacheKey) || {};

            const isMultiAuth = selectedDataSource?.options?.multiple_auth_enabled;
            const userId = currentUser?.id;

            if (existingCache.isMultiAuth !== undefined && existingCache.isMultiAuth !== isMultiAuth) {
                handleFetch();
                return;
            }

            let cachedData = null;
            if (isMultiAuth) {
                if (userId && existingCache[userId]) {
                    cachedData = existingCache[userId][compositeDependencyKey];
                }
            } else {
                cachedData = existingCache[compositeDependencyKey];
            }

            if (cachedData) {
                setFetchedData(cachedData);
            } else {
                handleFetch();
            }
        }

    }, [compositeDependencyKey])

    const handleMainSelectionChange = (selectedOption) => {
        const selectedValue = selectedOption?.value ?? selectedOption;

        // Update the options based on the new selection
        const updatedOptions = {
            ...options,
            [propertyKey]: selectedValue
        };
        optionsChanged(updatedOptions);
    };

    const handleCodeChange = (val) => {
        const updatedOptions = {
            ...options,
            [propertyKey]: val
        };
        optionsChanged(updatedOptions);
    };

    const debouncedHandleCodeChange = React.useCallback(debounce(handleCodeChange, 300), [options, propertyKey]);

    const handleFxChange = () => {
        const newFxMode = !isFxMode;
        setIsFxMode(newFxMode);
        if (!newFxMode) {
            // When switching back to dropdown, if the value is dynamic, we might want to clear it or keep it?
            // Usually if it's dynamic code, it won't match a dropdown option.
            // But let's leave it as is, the Select component handles unmatched values gracefully usually or shows empty.
        }
    };



    // Get the current selected value to display
    const getCurrentValue = () => {
        const currentValue = options[propertyKey]?.value ?? value;
        if (!currentValue || !fetchedData.length) return null;

        const selectedOption = fetchedData.find(it => String(it.value) === String(currentValue));
        return selectedOption || null;
    };


    return (
        <div className="dynamic-selector-container">
            <div className="d-flex align-items-center gap-2 mb-3">
                <div className="flex-grow-1">
                    {isFxMode ? (
                        <CodeHinter
                            initialValue={options[propertyKey]?.value ?? value}
                            onChange={(val) => {
                                debouncedHandleCodeChange(val);
                            }}
                            mode="javascript"
                            lineNumbers={false}
                            className="dynamic-selector-code-hinter"
                        />
                    ) : (
                        <Select
                            options={fetchedData}
                            value={getCurrentValue()}
                            onChange={handleMainSelectionChange}
                            placeholder={`Select ${label ?? ''}`}
                            isDisabled={disabled || (isDependent && !depsReady) || fetchedData?.length === 0}
                            isLoading={isLoading}
                            useMenuPortal={disableMenuPortal ? false : !!queryName}
                            styles={computeSelectStyles ? computeSelectStyles('100%') : {}}
                            useCustomStyles={!!computeSelectStyles}
                        />
                    )}
                </div>

                {fxEnabled && (
                    <div className={`fx-button-wrapper ${isFxMode ? 'active' : ''}`}>
                        <FxButton
                            active={isFxMode}
                            onPress={handleFxChange}
                        />
                    </div>
                )}

                {!isFxMode && !dependsOn.length && <ButtonSolid
                    variant="secondary"
                    size="sm"
                    onClick={() => handleFetch(false)}
                    disabled={isLoading || disabled}
                    className="btn rounded-lg tw-ml-2"
                >
                    {isLoading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Loading...
                        </>
                    ) : (
                        opLabel || 'Fetch'
                    )}
                </ButtonSolid>}
            </div>

            {error && (
                <div className="alert alert-danger alert-sm mb-3">
                    {error}
                </div>
            )}

            {description && (
                <small className="text-muted d-block mb-3">
                    {description}
                </small>
            )}

        </div>
    );
};

export default DynamicSelector;