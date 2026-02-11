export const restapiQueryConfig = {
    defaultFields: [
        {
            type: "dropdown",
            fieldName: "Method",
            validations: {
                defaultValue: "GET",
                disabled: false,
            },
        },
        {
            type: "codeMirror",
            fieldName: "url",
            assertion: "have.attr",
            data: ["placeholder", "Enter request URL"],
        },
    ],
};
