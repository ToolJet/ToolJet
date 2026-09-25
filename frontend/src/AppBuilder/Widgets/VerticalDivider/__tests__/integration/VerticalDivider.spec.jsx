import { waitFor } from "@testing-library/react";
import {
  createWidgetHarness,
  binding,
} from "@/AppBuilder/Widgets/__tests__/integration/widgetHarness";
import { verticalDividerConfig as frontendConfig } from "@/AppBuilder/WidgetManager/widgets/verticalDivider";
import { verticalDividerConfig as serverConfig } from "../../../../../../../server/src/modules/apps/services/widget-config/verticalDivider";

const ID = "verticalDivider1";
const HANDLE = "verticalDivider1";

const defaultProperties = {
  visibility: binding("{{true}}"),
  tooltip: binding(""),
  tooltipFormat: binding("plainText"),
};

const defaultStyles = {
  dividerColor: binding("var(--cc-default-border)"),
  dividerStyle: binding("solid"),
  padding: binding("default"),
  boxShadow: binding("0px 0px 0px 0px #00000040"),
};

const widget = createWidgetHarness({
  componentType: "VerticalDivider",
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
});

const root = (container) => container.querySelector(`[data-cy="${HANDLE}"]`);

async function setProperty(property, value) {
  await widget.session.store.act(() =>
    widget.setComponentProperty(ID, property, value, "properties")
  );
}

async function setStyle(property, value) {
  await widget.session.store.act(() =>
    widget.setComponentProperty(ID, property, value, "styles")
  );
}

describe("Vertical Divider widget", () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test("[VerticalDivider-REN-001] default VerticalDivider renders one centered vertical line", async () => {
    // Break this catches: changing the vertical axis, adding extra content, or losing the centering container.
    const { container } = widget.render();
    const divider = await waitFor(() => {
      const node = root(container);
      expect(node).toBeInTheDocument();
      return node;
    });

    expect(divider).toHaveClass("justify-content-center");
    expect(divider).toHaveStyle({
      display: "flex",
      width: "100%",
      height: "100%",
    });
    expect(divider).toHaveTextContent("");
    expect(divider.children).toHaveLength(1);
    expect(divider.firstElementChild).toHaveStyle({
      width: "1px",
      height: "100%",
      border: "none",
    });
  });

  test("[VerticalDivider-LIN-001] solid and dashed styles select the correct observable vertical branch", async () => {
    // Break this catches: routing dashed through the solid branch, repeating on the wrong axis, or remounting the line on updates.
    const { container } = widget.render({
      styles: {
        dividerColor: binding("#3366ff"),
        dividerStyle: binding("solid"),
      },
    });
    const line = root(container).firstElementChild;
    await waitFor(() =>
      expect(line).toHaveStyle({ backgroundColor: "#3366ff" })
    );
    expect(line).toHaveStyle({ height: "100%", width: "1px", border: "none" });

    await setStyle("dividerStyle", "dashed");
    await waitFor(() => expect(line.style.backgroundRepeat).toBe("repeat-y"));
    expect(root(container).firstElementChild).toBe(line);
    expect(line).toHaveStyle({
      backgroundColor: "transparent",
      backgroundSize: "1px 8px",
      backgroundRepeat: "repeat-y",
      border: "none",
    });
  });

  test("[VerticalDivider-CLR-001] legacy black colors follow the light/dark fallback", async () => {
    // Break this catches: removing the saved-app black fallback, handling one spelling only, or recoloring authored custom colors.
    const light = widget.render({
      darkMode: false,
      styles: { dividerColor: binding("#000") },
    });
    await waitFor(() =>
      expect(root(light.container).firstElementChild).toHaveStyle({
        backgroundColor: "#000",
      })
    );

    widget.teardown();
    widget.setup();
    const dark = widget.render({
      darkMode: true,
      styles: { dividerColor: binding("#000000") },
    });
    await waitFor(() =>
      expect(root(dark.container).firstElementChild).toHaveStyle({
        backgroundColor: "#fff",
      })
    );

    widget.teardown();
    widget.setup();
    const custom = widget.render({
      darkMode: true,
      styles: { dividerColor: binding("#3366ff") },
    });
    await waitFor(() =>
      expect(root(custom.container).firstElementChild).toHaveStyle({
        backgroundColor: "#3366ff",
      })
    );
  });

  test.each(["edit", "view"])(
    "[VerticalDivider-VIS-001] visibility hides and restores the same VerticalDivider in %s mode",
    async (currentMode) => {
      // Break this catches: unmounting on hide, applying visibility in one mode only, or dropping line style when restored.
      const { container } = widget.render({
        currentMode,
        styles: {
          dividerColor: binding("#3366ff"),
          dividerStyle: binding("dashed"),
        },
      });
      const divider = root(container);
      const line = divider.firstElementChild;
      expect(divider).toHaveStyle({ display: "flex" });

      await setProperty("visibility", false);
      await waitFor(() => expect(divider).toHaveStyle({ display: "none" }));
      expect(divider.firstElementChild).toBe(line);

      await setProperty("visibility", true);
      await waitFor(() => expect(divider).toHaveStyle({ display: "flex" }));
      expect(divider.firstElementChild).toBe(line);
      expect(line).toHaveStyle({
        backgroundRepeat: "repeat-y",
        backgroundSize: "1px 8px",
      });
    }
  );

  test("[VerticalDivider-CMP-001] frontend and server registrations publish the same VerticalDivider contract", () => {
    // Break this catches: editing one registry so new and server-loaded apps receive different VerticalDivider APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: "VerticalDivider",
      displayName: "Vertical divider",
      component: "VerticalDivider",
      defaultSize: { width: 1, height: 100 },
      events: {},
      exposedVariables: {},
      properties: { visibility: { validation: { defaultValue: true } } },
      styles: {
        dividerColor: {
          validation: { defaultValue: "var(--cc-default-border)" },
        },
        dividerStyle: {
          options: [
            { displayName: "Solid", value: "solid" },
            { displayName: "Dashed", value: "dashed" },
          ],
        },
      },
      definition: {
        properties: { visibility: { value: "{{true}}" } },
        events: [],
        styles: {
          dividerColor: { value: "var(--cc-default-border)" },
          dividerStyle: { value: "solid" },
        },
      },
    });
    expect(frontendConfig.actions ?? []).toEqual([]);
  });
});
