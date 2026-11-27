export const appEditorSelector = {
    settings: {
        settingsSidebarIcon: '[data-cy="left-sidebar-settings-button"]',
        maintenanceToggle: '[data-cy="toggle-maintenance-mode"]',
        maxCanvasWidthInput: '[data-cy="maximum-canvas-width-input-field"]',
        maxCanvasWidthTypeDropdown: '[data-cy="dropdown-max-canvas-width-type"]',
        canvasBgFxButton: '[data-cy="canvas-bg-color-fx-button"]',
        appSlugInput: '[data-cy="app-slug-input-field"]',
    },

    editor: {
        inspector: {
            componentsExpandButton: '[data-cy="inspector-components-expand-button"]',
            detailPath: '[data-cy="inspector-detail-path"]',
            deleteComponentAction: '[data-cy="inspector-delete-component-action"]',
            anyDeleteInDetailActions: '.runtime-inspector__actions [data-cy*="delete"]',
            fxButtonAny: '[data-cy*="fx-button"]',
            codeInputFieldAny: '[data-cy*="input-field"]',
            codeEditorContent: '.cm-content',
            fieldWrapperAny: '.accordion-body-custom, .wrapper-div-code-editor',
        },

        components: {
            widgetSearchInput: '[data-cy="widget-search-box-search-bar"]',
            draggableBox: '.draggable-box',
            componentsPlusButton: '[data-cy="left-sidebar-components-button"]',
            addEventHandlerButton: '[data-cy="add-event-handler"]',
            popupButton: '.popup-btn',
        },

        pages: {
            pagesTabButton: '[data-cy="left-sidebar-pages-button"]',
            addNewPageButton: '#add-new-page',
            pageToggleInput: 'input.form-check-input',
            pageTextInput: 'input.form-control',
            envContainer: '[data-cy="env-container"]',
            envNameList: '[data-cy="env-name-list"]',
        },

        queryDetailsContainer: '.query-details > div',
    },
};

