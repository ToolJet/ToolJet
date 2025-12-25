import React, { useState, useEffect, useMemo } from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import Select from '@/_ui/Select';
import { dataqueryService } from '@/_services';
import { get, debounce } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

import { shallow } from 'zustand/shallow';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';

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
    fxEnabled = false
}) => {
    const isDependentField = dependsOn?.length > 0;

    const operationLabel = operation?.label || operation?.name || 'Fetch';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isFxMode, setIsFxMode] = useState(() => {
        if (options?.[`${propertyKey}_fx`] !== undefined) {
            return options[`${propertyKey}_fx`];
        }

        return false;
    });

    const depKeys = Array.isArray(dependsOn) ? dependsOn : [];
    const depValues = Object.fromEntries(depKeys.map(key => [key, options?.[key]?.value ?? options?.[key]]));
    const depsReady = depKeys.length === 0 || depKeys.every(key => {
        const value = options?.[key]?.value ?? options?.[key];
        return value !== undefined && value !== null && value !== '';
    });

    const [fetchedData, setFetchedData] = useState([]);
    const invokeMethod = operation?.invokeMethod || operation?.invoke_method;

    // Use zustand/shallow to avoid unnecessary re-renders
    const dependencyValues = useStore((state) => {
        if (!isDependentField) return {};
        const queryOptions = state.queryPanel.selectedQuery?.options || {};
        return depKeys.reduce((acc, key) => {
            acc[key] = queryOptions[key];
            return acc;
        }, {});
    }, shallow);

    const compositeDependencyKey = useMemo(() => Object.values(dependencyValues).join('_'), [dependencyValues]);

    const handleFetch = async () => {
        if (!selectedDataSource?.id || !invokeMethod) {
            console.error('[DynamicSelector] Missing data source or invoke method', { invokeMethod });
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
            const items = payload?.data || [];
            setFetchedData(items);

            if (isDependentField) {
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
                        throw new Error('[DynamicSelector] Multi-user auth enabled but no user ID found');
                    } else {
                        // Replace the user's cache with the new data, discarding previous dependency values
                        newCache[userId] = {
                            [parentValue]: items
                        };
                    }
                } else {
                    newCache = {
                        isMultiAuth: isMultiAuth,
                        [parentValue]: items
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
                            'nonDependentCache': items
                        };
                    }
                } else {
                    newCache = {
                        isMultiAuth: isMultiAuth,
                        'nonDependentCache': items
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
        } finally {
            setIsLoading(false);
        }
    };

    // Check queryOptions for cached value on mount
    useEffect(() => {
        if (!selectedDataSource || !selectedDataSource.options) return;

        const storedValue = get(options, propertyKey);
        if (storedValue) {
            // Check if the component depends on other fields, if yes then update the cache

            if (isDependentField) {
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
                        cachedData = existingCache[userId]['nonDependentCache'];
                    }
                } else {
                    cachedData = existingCache['nonDependentCache'];
                }

                if (cachedData) {
                    setFetchedData(cachedData);
                }
            }
        }
    }, [selectedDataSource])


    // Watch for changes in dependency state
    useEffect(() => {
        if (isDependentField && compositeDependencyKey && depsReady) {
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

    const handleSelectionChange = (selectedOption) => {
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

        const updatedOptions = {
            ...options,
            [`${propertyKey}_fx`]: newFxMode
        };
        optionsChanged(updatedOptions);

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

        const selectedOption = fetchedData.find(option => String(option.value) === String(currentValue));
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
                            onChange={handleSelectionChange}
                            placeholder={`Select ${label ?? ''}`}
                            isDisabled={disabled || (isDependentField && !depsReady) || fetchedData?.length === 0}
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

                {!dependsOn.length && (
                    <ButtonSolid
                        variant="secondary"
                        size="sm"
                        onClick={() => handleFetch(false)}
                        disabled={isLoading || disabled || isFxMode}
                        className="btn rounded-lg tw-ml-2"
                        style={{ visibility: isFxMode ? 'hidden' : 'visible' }}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Loading...
                            </>
                        ) : (
                            operationLabel || 'Fetch'
                        )}
                    </ButtonSolid>
                )}
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