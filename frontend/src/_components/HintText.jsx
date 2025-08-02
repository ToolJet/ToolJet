import React from "react";

const HintText = ({ hint, className = "" }) => {
  if (!hint) return null;

  return (
    <small
      className={`${className}`}
      style={{
        marginTop: "4px",
        fontSize: "11px",
        display: "block",
        fontWeight: "400",
        lineHeight: "16px",
        fontFamily: "IBM Plex Sans",
        color: "#6A727C",
      }}
    >
      {hint}
    </small>
  );
};

export default HintText;
