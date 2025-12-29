import React, { useState, useEffect, useMemo } from 'react';
import { ButtonSolid } from '@/_components/AppButton';
import Select from '@/_ui/Select';
import { dataqueryService } from '@/_services';
import { get, debounce } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';

import { shallow } from 'zustand/shallow';
import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { IconAlertTriangle } from '@tabler/icons-react';

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

    const currentUser = useStore((state) => state.user);

    const operationLabel = operation?.label || operation?.name || 'Fetch';

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [noAccessError, setNoAccessError] = useState(false);

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
            validateSelectedValue(items);

            if (isDependentField) {
                // Store in cache based on dependency value
                const cacheKey = `${propertyKey}_cache`;
                const existingCache = get(options, cacheKey) || {};

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
                    // No cache for this user - validate with empty array to trigger no-access warning if value is set
                    validateSelectedValue([]);
                } else {
                    setFetchedData(cachedData);
                    validateSelectedValue(cachedData);
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
                    validateSelectedValue(cachedData);
                } else {
                    validateSelectedValue([]);
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
                validateSelectedValue(cachedData);
            } else {
                handleFetch();
            }
        }

    }, [compositeDependencyKey])

    const handleSelectionChange = (selectedOption) => {
        const selectedValue = selectedOption?.value ?? selectedOption;

        // Clear no access error since user is making a new valid selection
        setNoAccessError(false);

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
    };


    // Get the current selected value to display
    const getCurrentValue = () => {
        const currentValue = options[propertyKey]?.value ?? options[propertyKey] ?? value;
        if (!currentValue) return null;

        // If we have fetched data, try to find the matching option
        if (fetchedData.length) {
            const selectedOption = fetchedData.find(option => String(option.value) === String(currentValue));
            if (selectedOption) {
                return selectedOption;
            }
        }

        // Fallback: show the stored value even if not in fetchedData
        // This handles the case where another user's selection is stored but not in current user's accessible options
        return {
            value: currentValue,
            label: currentValue,
        };
    };

    // Validate if the selected value exists in user's accessible options
    const validateSelectedValue = (cachedData) => {
        const currentValue = options[propertyKey]?.value ?? options[propertyKey] ?? value;

        if (!currentValue) {
            setNoAccessError(false);
            return;
        }

        if (!cachedData?.length) {
            setNoAccessError(true);
            return;
        }

        const hasAccess = cachedData.some(option => String(option.value) === String(currentValue));
        if (!hasAccess) {
            setNoAccessError(true);
        } else {
            setNoAccessError(false);
        }
    };

    return (
        <div className="dynamic-selector-container">
            <div className="d-flex align-items-center gap-2 mb-1">
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
                        <div style={{
                            border: (error || noAccessError) ? '1px solid #E54D2E' : 'none',
                            borderRadius: '6px'
                        }}>
                            <Select
                                options={fetchedData}
                                value={getCurrentValue()}
                                onChange={handleSelectionChange}
                                placeholder={`Select ${label ?? ''}`}
                                isDisabled={disabled || (isDependentField && !depsReady)}
                                isLoading={isLoading}
                                useMenuPortal={disableMenuPortal ? false : !!queryName}
                                styles={computeSelectStyles ? computeSelectStyles('100%') : {}}
                                useCustomStyles={!!computeSelectStyles}
                            />
                        </div>
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
                <div className="d-flex align-items-center gap-1 mt-1" style={{ color: '#E54D2E', fontSize: '12px' }}>
                    <IconAlertTriangle size={14} stroke={2} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                </div>
            )}

            {noAccessError && !error && (
                <div className="d-flex align-items-center gap-1 mt-1" style={{ color: '#E54D2E', fontSize: '12px' }}>
                    <IconAlertTriangle size={14} stroke={2} style={{ flexShrink: 0 }} />
                    <span>You do not have access to the selected {label || 'item'}. Once switched to an available one, this selection will be lost.</span>
                </div>
            )}

            {description && (
                <small className="text-muted d-block mt-2">
                    {description}
                </small>
            )}

        </div>
    );
};

export default DynamicSelector;