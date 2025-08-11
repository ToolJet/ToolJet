import React, { useState } from "react";
import InlineEdit from "./index.jsx";

const InlineEditExample = () => {
  const [text, setText] = useState("Click to edit this text");
  const [multilineText, setMultilineText] = useState(
    "This is a multiline text field.\nClick to edit."
  );
  const [requiredText, setRequiredText] = useState("Required field");

  const handleSave = (newValue) => {
    console.log("Saving:", newValue);
    setText(newValue);
  };

  const handleMultilineSave = (newValue) => {
    console.log("Saving multiline:", newValue);
    setMultilineText(newValue);
  };

  const handleRequiredSave = (newValue) => {
    console.log("Saving required:", newValue);
    setRequiredText(newValue);
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>InlineEdit Component Examples</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Basic Text Field</h3>
        <InlineEdit
          value={text}
          onSave={handleSave}
          placeholder="Enter some text..."
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Multiline Text Field</h3>
        <InlineEdit
          value={multilineText}
          onSave={handleMultilineSave}
          multiline={true}
          placeholder="Enter multiline text..."
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Required Field</h3>
        <InlineEdit
          value={requiredText}
          onSave={handleRequiredSave}
          required={true}
          placeholder="This field is required..."
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Email Validation</h3>
        <InlineEdit
          value=""
          onSave={(value) => console.log("Email saved:", value)}
          validation={validateEmail}
          placeholder="Enter email address..."
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Disabled Field</h3>
        <InlineEdit value="This field is disabled" disabled={true} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Read-only Field</h3>
        <InlineEdit value="This field is read-only" readOnly={true} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>With Max Length</h3>
        <InlineEdit
          value=""
          onSave={(value) => console.log("Limited text saved:", value)}
          maxLength={50}
          placeholder="Max 50 characters..."
        />
      </div>
    </div>
  );
};

export default InlineEditExample;
