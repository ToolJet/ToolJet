/**
 * Icon behaviour spec, run through the real RenderWidget/store path.
 *
 * Approved contract: `ee/test/app-builder/widgets/Icon/TESTING.md`.
 * Every maintained title starts with its approved scenario ID.
 */
import { fireEvent, waitFor } from "@testing-library/react";
import { iconConfig as frontendConfig } from "@/AppBuilder/WidgetManager/widgets/icon";
import { iconConfig as serverConfig } from "../../../../../../../server/src/modules/apps/services/widget-config/icon";
import { componentDefinition } from "@/test/app-builder";
import {
  binding,
  createWidgetHarness,
  MODULE_ID,
  setVariableOn,
  store,
} from "@/AppBuilder/Widgets/__tests__/integration/widgetHarness";

const ID = "ico1";
const HANDLE = "icon1";
const ID2 = "ico2";
const HANDLE2 = "icon2";
const SHADOW = "1px 2px 3px 4px rgba(0, 0, 0, 0.5)";
const GENERAL_SHADOW = "9px 8px 7px 6px rgba(1, 2, 3, 0.4)";
const COLOR = "#3366ff";

const defaultProperties = {
  icon: binding("IconHome2"),
  tooltip: binding(""),
  tooltipFormat: binding("plainText"),
  loadingState: binding("{{false}}"),
  visibility: binding("{{true}}"),
  disabledState: binding("{{false}}"),
};

const defaultStyles = {
  iconColor: binding("#000"),
  iconAlign: binding("center"),
  padding: binding("default"),
  boxShadow: binding("0px 0px 0px 0px #00000040"),
};

const widget = createWidgetHarness({
  componentType: "Icon",
  handle: HANDLE,
  id: ID,
  defaultProperties,
  defaultStyles,
  widgetHeight: 48,
  widgetWidth: 200,
});

const root = (container, handle = HANDLE) =>
  container.querySelector(`[data-cy="${handle}"]`);
const canvasNode = (container, handle = HANDLE) =>
  container.querySelector(`[data-cy="draggable-widget-${handle}"]`);
const iconSvg = (container, handle = HANDLE) =>
  root(container, handle)?.querySelector("svg.tabler-icon");
const loader = (container) => container.querySelector(".tj-widget-loader");
const placeholder = (container, handle = HANDLE) =>
  root(container, handle)?.querySelector("span");
const iconClass = (container, handle = HANDLE) =>
  iconSvg(container, handle)?.getAttribute("class") || "";

const countClicks = (sourceId = ID, key = "clickCount") =>
  setVariableOn(sourceId, "onClick", {
    key,
    value: `{{(variables.${key} ?? 0) + 1}}`,
  }).map((event) => ({
    ...event,
    id: `evt-${sourceId}-onClick`,
    name: `${sourceId} onClick counter`,
  }));
const countHovers = (sourceId = ID, key = "hoverCount") =>
  setVariableOn(sourceId, "onHover", {
    key,
    value: `{{(variables.${key} ?? 0) + 1}}`,
  }).map((event) => ({
    ...event,
    id: `evt-${sourceId}-onHover`,
    name: `${sourceId} onHover counter`,
  }));

function iconDefinition(id, handle, properties = {}, styles = {}) {
  const definition = componentDefinition(id, handle, "Icon", {
    ...defaultProperties,
    ...properties,
  });
  definition.component.definition.styles = { ...defaultStyles, ...styles };
  return definition;
}

async function setProperty(property, value, componentId = ID) {
  await widget.session.store.act(() =>
    widget.setComponentProperty(componentId, property, value, "properties")
  );
}

async function setStyle(property, value, componentId = ID) {
  await widget.session.store.act(() =>
    widget.setComponentProperty(componentId, property, value, "styles")
  );
}

describe("Icon widget", () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test("[Icon-ICO-001] Icon choice renders, updates, and handles saved-name boundaries", async () => {
    // Break this catches: ignoring a live icon binding, dropping the saved-name fallback, or
    // trying to construct an undefined component when a saved icon name is blank/unknown.
    const { container } = widget.render({
      extraComponents: {
        [ID2]: iconDefinition(ID2, HANDLE2, { icon: binding("") }),
      },
      also: [
        { id: ID2, componentType: "Icon", widgetHeight: 48, widgetWidth: 200 },
      ],
    });
    const stableCanvas = canvasNode(container);

    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-home-2")
    );
    expect(iconSvg(container, HANDLE2)).toBeNull();
    expect(placeholder(container, HANDLE2)).toBeInTheDocument();

    await setProperty("icon", "IconStar");
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-star")
    );
    expect(canvasNode(container)).toBe(stableCanvas);

    await setProperty("icon", "IconThatDoesNotExist");
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-home-2")
    );
    expect(canvasNode(container)).toBe(stableCanvas);
  });

  test("[Icon-EVT-001] Pointer click and hover dispatch their registered events once", async () => {
    // Break this catches: dropping either event, firing twice, or letting the widget gesture
    // bubble into the canvas/ancestor interaction surface.
    const bodyClick = jest.fn();
    const bodyMouseOver = jest.fn();
    document.body.addEventListener("click", bodyClick);
    document.body.addEventListener("mouseover", bodyMouseOver);
    try {
      const { container } = widget.render({
        events: [...countClicks(), ...countHovers()],
      });
      await waitFor(() => expect(iconSvg(container)).toBeInTheDocument());

      await widget.session.user.click(iconSvg(container));
      await waitFor(() => expect(widget.variables().clickCount).toBe(1));
      expect(bodyClick).not.toHaveBeenCalled();

      await widget.session.user.hover(iconSvg(container));
      await waitFor(() => expect(widget.variables().hoverCount).toBe(1));
      expect(bodyMouseOver).not.toHaveBeenCalled();
    } finally {
      document.body.removeEventListener("click", bodyClick);
      document.body.removeEventListener("mouseover", bodyMouseOver);
    }
  });

  test("[Icon-API-001] Mount publishes the Icon state and action API", async () => {
    // Break this catches: leaving the registered exposedVariables map empty at runtime, or
    // omitting a shipped CSA/state key from the public component handle.
    widget.render();

    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        id: ID,
        isVisible: true,
        isLoading: false,
        isDisabled: false,
        click: expect.any(Function),
        setVisibility: expect.any(Function),
        setLoading: expect.any(Function),
        setDisable: expect.any(Function),
      })
    );
  });

  test("[Icon-ACT-001] Programmatic click dispatches in every visual state", async () => {
    // Break this catches: routing click() through a missing/blocked DOM node so hidden,
    // loading, or disabled state silently suppresses an explicit programmatic dispatch.
    widget.render({ events: countClicks() });
    await waitFor(() =>
      expect(widget.exposed().click).toBeInstanceOf(Function)
    );

    await widget.act("click");
    await waitFor(() => expect(widget.variables().clickCount).toBe(1));

    await widget.act("setVisibility", false);
    await widget.act("click");
    await waitFor(() => expect(widget.variables().clickCount).toBe(2));

    await widget.act("setVisibility", true);
    await widget.act("setLoading", true);
    await widget.act("click");
    await waitFor(() => expect(widget.variables().clickCount).toBe(3));

    await widget.act("setLoading", false);
    await widget.act("setDisable", true);
    await widget.act("click");
    await waitFor(() => expect(widget.variables().clickCount).toBe(4));
  });

  test("[Icon-STA-001] State actions boolean-coerce and publish their DOM state", async () => {
    // Break this catches: publishing without re-rendering, re-rendering without publishing,
    // or retaining arbitrary truthy/falsy arguments instead of public booleans.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

    await widget.act("setVisibility", 0);
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveClass("d-none");

    await widget.act("setVisibility", "shown");
    expect(widget.exposed().isVisible).toBe(true);
    expect(root(container)).not.toHaveClass("d-none");

    await widget.act("setLoading", { truthy: true });
    expect(widget.exposed().isLoading).toBe(true);
    await waitFor(() => expect(loader(container)).toBeInTheDocument());
    expect(root(container)).toBeNull();

    await widget.act("setLoading", "");
    expect(widget.exposed().isLoading).toBe(false);
    await waitFor(() => expect(root(container)).toBeInTheDocument());

    await widget.act("setDisable", ["truthy"]);
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveAttribute("data-disabled", "true");
    expect(canvasNode(container)).toHaveClass("disabled");

    await widget.act("setDisable", null);
    expect(widget.exposed().isDisabled).toBe(false);
    expect(root(container)).toHaveAttribute("data-disabled", "false");
    expect(canvasNode(container)).not.toHaveClass("disabled");
  });

  test("[Icon-STA-002] CSA state survives no-op resolution and yields to real property changes", async () => {
    // Break this catches: re-running the property sync on unrelated/no-op updates, or dropping
    // an owning-property dependency so a later genuine change never reaches DOM/exposed state.
    const { container } = widget.render();
    await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

    await widget.act("setVisibility", false);
    await setProperty("tooltip", "unrelated");
    await setProperty("visibility", "{{true}}");
    expect(widget.exposed().isVisible).toBe(false);
    expect(root(container)).toHaveClass("d-none");
    await setProperty("visibility", "{{false}}");
    await widget.act("setVisibility", false);
    await setProperty("visibility", "{{true}}");
    await waitFor(() => expect(root(container)).not.toHaveClass("d-none"));
    expect(widget.exposed().isVisible).toBe(true);

    await widget.act("setLoading", true);
    await setProperty("loadingState", "{{false}}");
    expect(loader(container)).toBeInTheDocument();
    await setProperty("loadingState", "{{true}}");
    await widget.act("setLoading", true);
    await setProperty("loadingState", "{{false}}");
    await waitFor(() => expect(loader(container)).toBeNull());
    expect(widget.exposed().isLoading).toBe(false);

    await widget.act("setDisable", true);
    await setProperty("disabledState", "{{false}}");
    expect(canvasNode(container)).toHaveClass("disabled");
    await setProperty("disabledState", "{{true}}");
    await widget.act("setDisable", true);
    await setProperty("disabledState", "{{false}}");
    await waitFor(() =>
      expect(canvasNode(container)).not.toHaveClass("disabled")
    );
    expect(widget.exposed().isDisabled).toBe(false);
  });

  test("[Icon-COMB-001] Loading, visibility, and disabled state remain independent", async () => {
    // Break this catches: clearing loading by resetting all three local flags, which would
    // accidentally show or enable an icon that was hidden and disabled before the spinner.
    const { container } = widget.render();
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-home-2")
    );

    await widget.act("setVisibility", false);
    await widget.act("setDisable", true);
    await widget.act("setLoading", true);
    await waitFor(() => expect(loader(container)).toBeInTheDocument());
    expect(widget.exposed()).toMatchObject({
      isVisible: false,
      isDisabled: true,
      isLoading: true,
    });

    await widget.act("setLoading", false);
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-home-2")
    );
    expect(root(container)).toHaveClass("d-none");
    expect(root(container)).toHaveAttribute("data-disabled", "true");
    expect(canvasNode(container)).toHaveClass("disabled");
    expect(widget.exposed()).toMatchObject({
      isVisible: false,
      isDisabled: true,
      isLoading: false,
    });
  });

  test("[Icon-DIS-001] Disabled state exposes the approved CSS-gated contract", async () => {
    // Break this catches: dropping either the widget data marker or shared canvas class so
    // CSS can no longer block real pointer interaction while the icon remains visible.
    const { container } = widget.render({
      properties: { disabledState: binding("{{true}}") },
    });

    await waitFor(() => expect(iconSvg(container)).toBeInTheDocument());
    expect(widget.exposed().isDisabled).toBe(true);
    expect(root(container)).toHaveAttribute("data-disabled", "true");
    expect(canvasNode(container)).toHaveClass("disabled");
    expect(root(container)).not.toHaveClass("d-none");
  });

  test("[Icon-STY-001] Documented styles reach the correct public DOM boundary", async () => {
    // Break this catches: losing dark-mode remapping, applying widget styles to the wrong node,
    // or letting the universal box shadow overwrite Icon's own registered shadow.
    const { container } = widget.render({
      darkMode: true,
      afterSeed: () =>
        widget.setComponentProperty(
          ID,
          "boxShadow",
          GENERAL_SHADOW,
          "generalStyles"
        ),
    });
    await waitFor(() => expect(iconSvg(container)).toBeInTheDocument());
    expect(iconSvg(container)).toHaveAttribute("stroke", "#fff");
    expect(root(container).style.boxShadow).not.toBe(GENERAL_SHADOW);

    await setStyle("iconColor", COLOR);
    await setStyle("iconAlign", "right");
    await setStyle("padding", "none");
    await setStyle("boxShadow", SHADOW);

    await waitFor(() =>
      expect(iconSvg(container)).toHaveAttribute("stroke", COLOR)
    );
    expect(root(container)).toHaveStyle({
      textAlign: "right",
      boxShadow: SHADOW,
    });
    expect(canvasNode(container)).toHaveStyle({ padding: "0px" });

    await setProperty("icon", "IconStar");
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-star")
    );
    await widget.act("setVisibility", false);
    expect(root(container)).toHaveStyle({
      textAlign: "right",
      boxShadow: SHADOW,
    });
    expect(canvasNode(container)).toHaveStyle({ padding: "0px" });
    expect(iconSvg(container)).toHaveAttribute("stroke", COLOR);
  });

  test("[Icon-SIZ-001] Both registered aspect branches emit stable sizing rules", async () => {
    // Break this catches: swapping the wide/tall condition or restoring the old fixed-height
    // rule that clipped icons after the f2dd8343a05 sizing fix.
    const { container } = widget.render({
      extraComponents: { [ID2]: iconDefinition(ID2, HANDLE2) },
      also: [
        { id: ID2, componentType: "Icon", widgetHeight: 84, widgetWidth: 80 },
      ],
    });
    await waitFor(() => expect(iconSvg(container)).toBeInTheDocument());
    await waitFor(() =>
      expect(iconSvg(container, HANDLE2)).toBeInTheDocument()
    );

    expect(iconSvg(container)).toHaveStyle({ width: "auto", height: "100%" });
    expect(iconSvg(container, HANDLE2)).toHaveStyle({
      width: "80px",
      height: "auto",
    });

    await setProperty("icon", "IconStar");
    await setProperty("icon", "IconAnchor", ID2);
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-star")
    );
    await waitFor(() =>
      expect(iconClass(container, HANDLE2)).toContain("tabler-icon-anchor")
    );
    expect(iconSvg(container)).toHaveStyle({ width: "auto", height: "100%" });
    expect(iconSvg(container, HANDLE2)).toHaveStyle({
      width: "80px",
      height: "auto",
    });
  });

  test("[Icon-ASY-001] Lazy icon completion cannot restore a stale glyph after change or unmount", async () => {
    // Break this catches: an icon-loading effect that ignores iconName changes or applies an
    // obsolete async completion after the widget has moved to a newer glyph/unmounted.
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    try {
      // Warm only RenderWidget's outer React.lazy boundary. An empty name deliberately leaves
      // TablerIcon's own icon-pack import untouched, so the second instance below starts pending.
      const warm = widget.render({ properties: { icon: binding("") } });
      await waitFor(() =>
        expect(placeholder(warm.container)).toBeInTheDocument()
      );

      const rendered = widget.render({
        properties: { icon: binding("") },
        extraComponents: {
          [ID2]: iconDefinition(ID2, HANDLE2, { icon: binding("IconAlarm") }),
        },
        also: [
          {
            id: ID2,
            componentType: "Icon",
            widgetHeight: 48,
            widgetWidth: 200,
          },
        ],
      });
      expect(placeholder(rendered.container, HANDLE2)).toBeInTheDocument();
      await setProperty("icon", "IconAntennaBars5", ID2);

      await waitFor(() =>
        expect(iconClass(rendered.container, HANDLE2)).toContain(
          "tabler-icon-antenna-bars-5"
        )
      );
      expect(
        root(rendered.container, HANDLE2).querySelector("svg.tabler-icon-alarm")
      ).toBeNull();

      consoleError.mockClear();
      rendered.unmount();
      await Promise.resolve();
      await Promise.resolve();
      expect(rendered.container).toBeEmptyDOMElement();
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  test("[Icon-ISO-001] Two Icon instances keep state, glyphs, actions, and events isolated", async () => {
    // Break this catches: module-level state or non-id-scoped exposed writes leaking a glyph,
    // visibility flag, event count, or deletion effect into the sibling instance.
    const { container } = widget.render({
      extraComponents: {
        [ID2]: iconDefinition(
          ID2,
          HANDLE2,
          { icon: binding("IconStar") },
          { iconColor: binding("#cc0000") }
        ),
      },
      also: [
        { id: ID2, componentType: "Icon", widgetHeight: 48, widgetWidth: 200 },
      ],
      events: [
        ...countClicks(ID, "firstClicks"),
        ...countClicks(ID2, "secondClicks"),
      ],
    });
    await waitFor(() =>
      expect(iconClass(container)).toContain("tabler-icon-home-2")
    );
    await waitFor(() =>
      expect(iconClass(container, HANDLE2)).toContain("tabler-icon-star")
    );

    await widget.act("click");
    await waitFor(() => expect(widget.variables().firstClicks).toBe(1));
    expect(widget.variables().secondClicks).toBeUndefined();

    await widget.act("setVisibility", false);
    expect(root(container)).toHaveClass("d-none");
    expect(root(container, HANDLE2)).not.toHaveClass("d-none");
    expect(widget.exposed(ID2).isVisible).toBe(true);

    await widget.session.store.act(async () => widget.exposed(ID2).click());
    await waitFor(() => expect(widget.variables().secondClicks).toBe(1));
    expect(widget.variables().firstClicks).toBe(1);

    await widget.session.store.act(() =>
      store().deleteComponents([ID], MODULE_ID, {
        saveAfterAction: false,
        skipUndoRedo: true,
      })
    );
    await waitFor(() => expect(root(container)).not.toBeInTheDocument());
    expect(root(container, HANDLE2)).toBeInTheDocument();
    expect(iconClass(container, HANDLE2)).toContain("tabler-icon-star");
    expect(widget.exposed(ID2).isVisible).toBe(true);
  });

  test("[Icon-CMP-001] Frontend and server registrations remain semantically equal", () => {
    // Break this catches: changing one independently maintained registry so newly-created and
    // server-loaded Icon widgets get different defaults, actions, params, events, or styles.
    expect(serverConfig).toEqual(frontendConfig);
    expect(frontendConfig).toMatchObject({
      name: "Icon",
      component: "Icon",
      defaultSize: { width: 5, height: 48 },
      properties: {
        icon: { validation: { defaultValue: "IconHome2" } },
        loadingState: { validation: { defaultValue: false } },
        visibility: { validation: { defaultValue: true } },
        disabledState: { validation: { defaultValue: false } },
      },
      events: {
        onClick: { displayName: "On click" },
        onHover: { displayName: "On hover" },
      },
      exposedVariables: {},
      definition: {
        properties: {
          icon: { value: "IconHome2" },
          loadingState: { value: "{{false}}" },
          visibility: { value: "{{true}}" },
          disabledState: { value: "{{false}}" },
        },
      },
    });
    expect(frontendConfig.actions.map((action) => action.handle)).toEqual([
      "click",
      "setVisibility",
      "setLoading",
      "setDisable",
    ]);
    expect(
      frontendConfig.actions.slice(1).map((action) => action.params[0].handle)
    ).toEqual(["value", "setLoading", "setDisable"]);
  });
});
