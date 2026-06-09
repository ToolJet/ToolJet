// storybookDecorators.js

import React, { useEffect } from "react";
import { MemoryRouter } from "react-router-dom";

export function withColorScheme(story, context) {
  const isDarkMode = context?.globals?.theme === "dark";

  useEffect(() => {
    document.querySelectorAll(".storybook-docs, .storybook-preview-wrapper, .sb-show-main").forEach((el) => {
      el.classList.toggle("dark-theme", isDarkMode);
    });
  }, [isDarkMode]);

  return (
    <div
      className={isDarkMode ? "dark-theme" : ""}
      style={{
        backgroundColor: "var(--background-surface-layer-01)",
      }}
    >
      {story()}
    </div>
  );
}

export function withRouter(story) {
  return <MemoryRouter>{story()}</MemoryRouter>;
}
