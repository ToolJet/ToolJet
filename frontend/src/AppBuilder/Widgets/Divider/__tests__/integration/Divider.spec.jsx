import { waitFor } from "@testing-library/react";
import {
  createWidgetHarness,
  binding,
} from "@/AppBuilder/Widgets/__tests__/integration/widgetHarness";
import { dividerConfig as frontendConfig } from "@/AppBuilder/WidgetManager/widgets/divider";
import { dividerConfig as serverConfig } from "../../../../../../../server/src/modules/apps/services/widget-config/divider";

const ID = "divider1";
const HANDLE = "horizontalDivider1";

const defaultProperties = {
  visibility: binding("{{true}}"),
  tooltip: binding(""),
  tooltipFormat: binding("plainText"),
};

const defaultStyles = {
  dividerColor: binding("var(--cc-default-border)"),
  labelAlignment: binding("center"),
  dividerStyle: binding("solid"),
  labelColor: binding("var(--cc-placeholder-text)"),
  textWrap: binding("wrap"),
  padding: binding("default"),
  boxShadow: binding("0px 0px 0px 0px #00000040"),
};

const widget = createWidgetHarness({
  componentType: "Divider",
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

describe("Horizontal Divider widget", () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test("[Divider-REN-001] default and label-free Divider render one horizontal line", async () => {
    // Break this catches: removing the label-free branch or accidentally rendering an empty label as text/two lines.
    const { container } = widget.render();
    const divider = await waitFor(() => {
      const node = root(container);
      expect(node).toBeInTheDocument();
      return node;
    });

    expect(divider).toHaveStyle({
      display: "flex",
      width: "100%",
      height: "100%",
    });
    expect(divider).toHaveTextContent("");
    expect(divider.children).toHaveLength(1);
    expect(divider.firstElementChild).toHaveStyle({
      width: "100%",
      height: "1px",
      borderTop: "none",
    });
  });

  test("[Divider-LBL-001] label alignment controls line placement and label color", async () => {
    // Break this catches: swapping a side branch, dropping a center line, or failing to apply live label/color updates.
    const { container } = widget.render({
      properties: { label: binding("Section") },
      styles: {
        labelAlignment: binding("left"),
        labelColor: binding("#3366ff"),
      },
    });

    const divider = root(container);
    await waitFor(() => expect(divider.children).toHaveLength(2));
    expect(divider.children[0].tagName).toBe("SPAN");
    expect(divider.children[0]).toHaveTextContent("Section");
    expect(divider.children[0]).toHaveStyle({ color: "#3366ff" });
    expect(divider.children[1].tagName).toBe("DIV");

    await setStyle("labelAlignment", "center");
    await waitFor(() =>
      expect(divider.firstElementChild.children).toHaveLength(3)
    );
    expect(divider.firstElementChild.children[0].tagName).toBe("DIV");
    expect(divider.firstElementChild.children[1]).toHaveTextContent("Section");
    expect(divider.firstElementChild.children[2].tagName).toBe("DIV");

    await setStyle("labelAlignment", "right");
    await waitFor(() => expect(divider.children).toHaveLength(2));
    expect(divider.children[0].tagName).toBe("DIV");
    expect(divider.children[1]).toHaveTextContent("Section");

    await setProperty("label", "Updated");
    await setStyle("labelColor", "#ff0000");
    await waitFor(() =>
      expect(divider.children[1]).toHaveTextContent("Updated")
    );
    expect(divider.children[1]).toHaveStyle({ color: "#ff0000" });
  });

  test("[Divider-WRP-001] text-wrap mode changes the label overflow contract", async () => {
    // Break this catches: losing ellipsis, applying the side-label width to center, or leaving stale nowrap styles after wrap.
    const { container } = widget.render({
      properties: { label: binding("A long section label") },
      styles: {
        labelAlignment: binding("center"),
        textWrap: binding("nowrap"),
      },
    });

    const divider = root(container);
    const label = () => divider.querySelector("span");
    await waitFor(() =>
      expect(label()).toHaveStyle({
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      })
    );
    expect(label()).toHaveStyle({
      overflow: "hidden",
      maxWidth: "80%",
      flexShrink: "0",
    });

    await setStyle("labelAlignment", "left");
    await waitFor(() => expect(label()).toHaveStyle({ maxWidth: "90%" }));

    await setStyle("textWrap", "wrap");
    await waitFor(() => expect(label().style.whiteSpace).toBe(""));
    expect(label().style.overflow).toBe("");
    expect(label().style.textOverflow).toBe("");
    expect(label().style.maxWidth).toBe("");
    expect(label().style.flexShrink).toBe("");
  });

  test("[Divider-LIN-001] solid and dashed styles select the correct observable line branch", async () => {
    // Break this catches: routing dashed styling through the solid branch, using the wrong repeat/size, or updating only one center line.
    const { container } = widget.render({
      properties: { label: binding("Section") },
      styles: {
        dividerColor: binding("#3366ff"),
        dividerStyle: binding("solid"),
      },
    });

    const divider = root(container);
    const lines = () => [
      divider.firstElementChild.children[0],
      divider.firstElementChild.children[2],
    ];
    await waitFor(() =>
      expect(lines()[0]).toHaveStyle({ backgroundColor: "#3366ff" })
    );
    for (const line of lines()) {
      expect(line).toHaveStyle({
        height: "1px",
        backgroundColor: "#3366ff",
        borderTop: "none",
      });
      expect(line.style.backgroundImage).toBe("");
    }

    await setStyle("dividerStyle", "dashed");
    await waitFor(() =>
      expect(lines()[0].style.backgroundRepeat).toBe("repeat-x")
    );
    for (const line of lines()) {
      expect(line).toHaveStyle({
        height: "1px",
        backgroundColor: "transparent",
        backgroundSize: "8px 1px",
        backgroundRepeat: "repeat-x",
        borderTop: "none",
      });
    }
  });

  test("[Divider-CLR-001] legacy black colors follow the light/dark fallback", async () => {
    // Break this catches: removing the saved-app black fallback, applying dark-mode white to custom colors, or handling only one black spelling.
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
    "[Divider-VIS-001] visibility hides and restores the same Divider in %s mode",
    async (currentMode) => {
      // Break this catches: unmounting on hide, applying visibility in one mode only, or dropping label/style state when restored.
      const { container } = widget.render({
        currentMode,
        properties: { label: binding("Section") },
        styles: {
          dividerColor: binding("#3366ff"),
          dividerStyle: binding("dashed"),
          labelAlignment: binding("right"),
        },
      });
      const divider = root(container);
      const label = divider.querySelector("span");
      const line = divider.firstElementChild;
      expect(divider).toHaveStyle({ display: "flex" });

      await setProperty("visibility", false);
      await waitFor(() => expect(divider).toHaveStyle({ display: "none" }));
      expect(divider.querySelector("span")).toBe(label);
      expect(divider.firstElementChild).toBe(line);

      await setProperty("visibility", true);
      await waitFor(() => expect(divider).toHaveStyle({ display: "flex" }));
      expect(divider.querySelector("span")).toBe(label);
      expect(label).toHaveTextContent("Section");
      expect(divider.firstElementChild).toBe(line);
      expect(line).toHaveStyle({ backgroundRepeat: "repeat-x" });
    }
  );

  test("[Divider-CMP-001] frontend and server registrations publish the same Divider contract", () => {
    // Break this catches: editing one registry so new and server-loaded apps receive different Divider APIs.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: "HorizontalDivider",
      displayName: "Horizontal Divider",
      component: "Divider",
      defaultSize: { width: 10, height: 10 },
      events: {},
      exposedVariables: {},
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
        labelAlignment: { validation: { defaultValue: "left" } },
        textWrap: { validation: { defaultValue: "wrap" } },
      },
      definition: {
        properties: { label: { value: "" }, visibility: { value: "{{true}}" } },
        events: [],
        styles: {
          dividerColor: { value: "var(--cc-default-border)" },
          labelAlignment: { value: "center" },
          dividerStyle: { value: "solid" },
          textWrap: { value: "wrap" },
        },
      },
    });
    expect(frontendConfig.actions ?? []).toEqual([]);
  });

  test("[Divider-SEC-001] markup-looking labels render only as text", async () => {
    // Break this catches: treating a bound label as HTML and creating executable elements.
    delete window.__dividerXss;
    const markup =
      '<img src=x onerror="window.__dividerXss=true"><script>window.__dividerXss=true</script>';
    const { container } = widget.render({
      properties: { label: binding(markup) },
    });
    const divider = root(container);

    await waitFor(() => expect(divider).toHaveTextContent(markup));
    expect(divider.querySelector("img")).toBeNull();
    expect(divider.querySelector("script")).toBeNull();
    expect(window.__dividerXss).toBeUndefined();
  });
});
