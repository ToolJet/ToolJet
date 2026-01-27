import { useState, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';

export const useOptionsManager = (component, paramUpdated) => {
    const [options, setOptions] = useState([]);
    const [hoveredOptionIndex, setHoveredOptionIndex] = useState(null);

    const getResolvedValue = useStore((state) => state.getResolvedValue, shallow);

    const isDynamicOptionsEnabled = getResolvedValue(component?.component?.definition?.properties?.advanced?.value);

    // Helper function to update options
    const updateOptions = (newOptions) => {
        setOptions(newOptions);
        paramUpdated({ name: 'options' }, 'value', newOptions, 'properties', false);
    };

    // Helper function to construct options from component definition
    const constructOptions = () => {
        let optionsValue = component?.component?.definition?.properties?.options?.value;
        if (!Array.isArray(optionsValue)) {
            optionsValue = Object.values(optionsValue);
        }
        let options = [];

        if (isDynamicOptionsEnabled || typeof optionsValue === 'string') {
            options = getResolvedValue(optionsValue);
        } else {
            options = optionsValue?.map((option) => option);
        }
        return options.map((option) => {
            const newOption = { ...option };

            Object.keys(option).forEach((key) => {
                if (typeof option[key]?.value === 'boolean') {
                    newOption[key]['value'] = `{{${option[key]?.value}}}`;
                }
            });

            return newOption;
        });
    };

    // Helper function to generate new option
    const generateNewOptions = () => {
        let found = false;
        let label = '';
        let currentNumber = options.length + 1;
        let value = currentNumber;
        while (!found) {
            label = `option${currentNumber}`;
            value = currentNumber.toString();
            if (options.find((option) => option.label === label) === undefined) {
                found = true;
            }
            currentNumber += 1;
        }

        return {
            format: 'plain',
            label,
            description: ``,
            value,
            icon: {
                value: [
                    'IconBriefcase',
                    'IconStar',
                    'IconSettings',
                    'IconUser',
                    'IconHome',
                    'IconSearch',
                    'IconBell',
                    'IconMail',
                    'IconCamera',
                    'IconMusic',
                ][Math.floor(Math.random() * 10)],
            },
            iconVisibility: false,
            visible: { value: '{{true}}' },
            disable: { value: '{{false}}' },
        };
    };

    // Helper function for drag and drop styling
    const getItemStyle = (isDragging, draggableStyle) => ({
        userSelect: 'none',
        ...draggableStyle,
    });

    // Event handlers
    const handleOptionChange = (propertyPath, value, index) => {
        const newOptions = options.map((option, i) => {
            if (i === index) {
                if (propertyPath.includes('.')) {
                    const [parentKey, childKey] = propertyPath.split('.');
                    return {
                        ...option,
                        [parentKey]: {
                            ...option[parentKey],
                            [childKey]: value,
                        },
                    };
                }
                return {
                    ...option,
                    [propertyPath]: value,
                };
            }
            return option;
        });
        updateOptions(newOptions);
    };

    const handleDeleteOption = (index) => {
        const newOptions = options.filter((option, i) => i !== index);
        updateOptions(newOptions);
    };

    const handleAddOption = () => {
        let _option = generateNewOptions();
        const newOptions = [...options, _option];
        updateOptions(newOptions);
    };

    const reorderOptions = async (startIndex, endIndex) => {
        const result = [...options];
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        updateOptions(result);
    };

    const onDragEnd = ({ source, destination }) => {
        if (!destination || source?.index === destination?.index) {
            return;
        }
        reorderOptions(source.index, destination.index);
    };

    // Side effects
    useEffect(() => {
        const newOptions = constructOptions();
        setOptions(newOptions);
    }, [isDynamicOptionsEnabled]);

    return {
        options,
        hoveredOptionIndex,
        setHoveredOptionIndex,
        handleOptionChange,
        handleDeleteOption,
        handleAddOption,
        onDragEnd,
        getItemStyle,
        getResolvedValue,
        isDynamicOptionsEnabled,
    };
};
