export const appEditorSelector = {
    settings: {
        settingsSidebarIcon: '.sidebar-svg-icon .lucide-bolt',
        maintenanceToggle: '[data-cy="toggle-maintenance-mode"]',
        maxCanvasWidthInput: '[data-cy="maximum-canvas-width-input-field"]',
        maxCanvasWidthTypeDropdown: '[data-cy="dropdown-max-canvas-width-type"]',
        canvasBgFxButton: '[data-cy="canvas-bg-color-fx-button"]',
        appSlugInput: '[data-cy="app-slug-input-field"]',
    },

    editor: {
        inspector: {
            buttonAria: 'button[aria-label="Inspector"]',
            componentsNode: '[data-cy="inspector-components-node"]',
            menuIcon: '[data-cy="inspector-menu-icon"]',
            popoverBody: '.popover-body',
            anyDeleteInPopover: '[data-cy*="delete"]',
            fxButtonAny: '[data-cy*="fx-button"]',
            codeInputFieldAny: '[data-cy*="input-field"]',
            codeEditorContent: '.cm-content',
            fieldWrapperAny: '.accordion-body-custom, .wrapper-div-code-editor',
        },

        components: {
            widgetSearchInput: '[data-cy="widget-search-box-search-bar"]',
            draggableBox: '.draggable-box',
            componentsPlusButton: '[data-cy="right-sidebar-components-button"]',
            addEventHandlerButton: '[data-cy="add-event-handler"]',
            popupButton: '.popup-btn',
        },

        pages: {
            pagesTabButton: '[data-cy="right-sidebar-file01-button"]',
            addNewPageButton: '#add-new-page',
            pageToggleInput: 'input.form-check-input',
            pageTextInput: 'input.form-control',
            envContainer: '[data-cy="env-container"]',
            envNameList: '[data-cy="env-name-list"]',
        },

        queryDetailsContainer: '.query-details',
    },
};

