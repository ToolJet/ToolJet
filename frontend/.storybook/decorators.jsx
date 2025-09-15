// storybookDecorators.js

import React from "react";
import { MemoryRouter } from "react-router-dom";

export function withColorScheme(story, context) {
  const darkMode = context?.globals?.backgrounds?.value === "#333333"; // Access theme mode from globals
  const className = darkMode ? "dark-theme" : "";

  return (
    <div className={className} style={{ backgroundColor: "transparent" }}>
      {story()}
    </div>
  );
}

export function withRouter(story) {
  return <MemoryRouter>{story()}</MemoryRouter>;
}
