export const fileinputConfig = {
  name: "FileInput",
  displayName: "File input",
  description: "File input",
  component: "FileInput",
  defaultSize: {
    width: 10,
    height: 40,
  },
  others: {
    showOnDesktop: { type: "toggle", displayName: "Show on desktop" },
    showOnMobile: { type: "toggle", displayName: "Show on mobile" },
  },
  actions: [
    {
      handle: "clear",
      displayName: "Clear",
    },
    {
      handle: "setFocus",
      displayName: "Set Focus",
    },
    {
      handle: "setBlur",
      displayName: "Set Blur",
    },
    {
      handle: "setVisibility",
      displayName: "Set Visibility",
      params: [
        {
          handle: "disable",
          displayName: "Value",
          defaultValue: "{{false}}",
          type: "toggle",
        },
      ],
    },
    {
      handle: "setLoading",
      displayName: "Set Loading",
      params: [
        {
          handle: "loading",
          displayName: "Value",
          defaultValue: "{{false}}",
          type: "toggle",
        },
      ],
    },
    {
      handle: "setDisable",
      displayName: "Set Disable",
      params: [
        {
          handle: "disable",
          displayName: "Value",
          defaultValue: "{{false}}",
          type: "toggle",
        },
      ],
    },
  ],
  properties: {
    label: {
      type: "code",
      displayName: "Label",
      validation: {
        schema: { type: "string" },
        defaultValue: "Label",
      },
      accordian: "Data",
    },
    instructionText: {
      type: "code",
      displayName: "Placeholder",
      validation: {
        schema: { type: "string" },
        defaultValue: "Select file(s)",
      },
      accordian: "Data",
    },
    enableMultiple: {
      type: "toggle",
      displayName: "Pick multiple files",
      validation: {
        schema: { type: "boolean" },
        defaultValue: true,
      },
      accordian: "Data",
    },
    parseContent: {
      type: "toggle",
      displayName: "Parse content",
      validation: {
        schema: {
          type: "boolean",
        },
        defaultValue: false,
      },
      accordian: "Data",
    },
    parseFileType: {
      type: "select",
      displayName: "File type",
      options: [
        { name: "Autodetect from extension", value: "auto-detect" },
        { name: "CSV", value: "csv" },
        { name: "Microsoft Excel - xls", value: "xls" },
        {
          name: "Microsoft Excel - xlsx",
          value: "xlsx",
        },
        {
          name: "JSON",
          value: "json",
        },
      ],
      validation: {
        schema: {
          type: "string",
        },
        defaultValue: "auto-detect",
      },
      accordian: "Data",
    },
    loadingState: {
      type: "toggle",
      displayName: "Loading",
      section: "additionalActions",
      validation: {
        schema: { type: "boolean" },
        defaultValue: false,
      },
    },
    visibility: {
      type: "toggle",
      displayName: "Visibility",
      section: "additionalActions",
      validation: {
        schema: { type: "boolean" },
        defaultValue: true,
      },
    },
    disabledState: {
      type: "toggle",
      displayName: "Disable",
      section: "additionalActions",
      validation: {
        schema: { type: "boolean" },
        defaultValue: false,
      },
    },
    tooltip: {
      type: "code",
      displayName: "Tooltip",
      section: "additionalActions",
      validation: {
        schema: { type: "string" },
        defaultValue: "",
      },
    },
  },
  events: {
    onFileSelected: { displayName: "On File Selected" },
    onFileLoaded: { displayName: "On File Loaded" },
  },
  validation: {
    enableValidation: {
      type: "toggle",
      displayName: "Mark as mandatory",
      validation: {
        schema: {
          type: "boolean",
        },
        defaultValue: false,
      },
    },
    fileType: {
      type: "code",
      displayName: "File Type",
      validation: {
        schema: {
          type: "string",
        },
        defaultValue: "*/*",
      },
    },
    minSize: {
      type: "code",
      displayName: "Min size (Bytes)",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: 50,
      },
    },
    maxSize: {
      type: "code",
      displayName: "Max size (Bytes)",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: 51200000,
      },
    },
    minFileCount: {
      type: "code",
      displayName: "Min files",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: 0,
      },
    },
    maxFileCount: {
      type: "code",
      displayName: "Max files",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: 2,
      },
    },
  },
  styles: {
    backgroundColor: {
      type: "colorSwatches",
      displayName: "Background",
      validation: {
        schema: { type: "string" },
        defaultValue: "var(--cc-surface1-surface)",
      },
      accordian: "field",
    },
    borderColor: {
      type: "colorSwatches",
      displayName: "Border",
      validation: {
        schema: { type: "string" },
        defaultValue: "var(--cc-default-border)",
      },
      accordian: "field",
    },
    accentColor: {
      type: "colorSwatches",
      displayName: "Accent",
      validation: {
        schema: { type: "string" },
        defaultValue: "var(--cc-primary-brand)",
      },
      accordian: "field",
    },
    textColor: {
      type: "colorSwatches",
      displayName: "Text",
      validation: {
        schema: { type: "string" },
        defaultValue: "var(--cc-primary-text)",
      },
      accordian: "field",
    },
    errTextColor: {
      type: "colorSwatches",
      displayName: "Error text",
      validation: {
        schema: { type: "string" },
        defaultValue: "var(--cc-error-systemStatus)",
      },
      accordian: "field",
    },
    borderRadius: {
      type: "numberInput",
      displayName: "Border radius",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: 6,
      },
      accordian: "field",
    },
    boxShadow: {
      type: "boxShadow",
      displayName: "Box shadow",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: "0px 0px 0px 0px #00000040",
      },
      accordian: "field",
    },
    padding: {
      type: "switch",
      displayName: "Padding",
      validation: {
        schema: {
          type: "union",
          schemas: [{ type: "string" }, { type: "number" }],
        },
        defaultValue: "default",
      },
      isFxNotRequired: true,
      options: [
        { displayName: "Default", value: "default" },
        { displayName: "None", value: "none" },
      ],
      accordian: "container",
    },
  },
  exposedVariables: {
    files: [],
    id: "",
    isParsing: false,
    isValid: true,
    fileSize: 0,
    isMandatory: false,
    isLoading: false,
    isVisible: true,
    isDisabled: false,
  },
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" },
      showOnMobile: { value: "{{false}}" },
    },
    properties: {
      label: { value: "Label" },
      instructionText: { value: "Select file(s)" },
      enableMultiple: { value: "{{true}}", fxActive: false },
      parseContent: { value: "{{false}}" },
      parseFileType: { value: "auto-detect" },
      loadingState: { value: "{{false}}" },
      visibility: { value: "{{true}}" },
      disabledState: { value: "{{false}}" },
      tooltip: { value: "" },
    },
    events: [],
    styles: {
      backgroundColor: { value: "var(--cc-surface1-surface)" },
      borderColor: { value: "var(--cc-default-border)" },
      accentColor: { value: "var(--cc-primary-brand)" },
      textColor: { value: "var(--cc-primary-text)" },
      errTextColor: { value: "var(--cc-error-systemStatus)" },
      borderRadius: { value: "{{6}}" },
      padding: { value: "default" },
      boxShadow: { value: "0px 0px 0px 0px #00000040" },
    },
    validation: {
      enableValidation: { value: "{{false}}" },
      fileType: { value: "*/*" },
      minSize: { value: "{{50}}" },
      maxSize: { value: "{{51200000}}" },
      minFileCount: { value: "{{0}}" },
      maxFileCount: { value: "{{2}}" },
    },
  },
};
