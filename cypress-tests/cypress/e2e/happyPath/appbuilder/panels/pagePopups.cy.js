import {
  api,
  evidence,
  forEachTheme,
  openEditor,
  openPanel,
  seedPanelApp,
  settledValue,
} from "Support/utils/appBuilder/panelAudit";

// Page popups open beside the Pages panel, fully inside the viewport (LR-23), and New page stays in reach
// under a long page list without scrolling the panel title away (UC-14).
const appName = `page-popups-${Date.now()}`;
const VIEWPORTS = [
  [1440, 900],
  [1024, 768],
  [1440, 600],
];
const POPUP = "#add-new-page-popup:not(.add-new-page-popup--embedded)";
const SHELL = ".sidebar-h-100-popover";

const box = (el) => {
  const { left, right, top, bottom } = el.getBoundingClientRect();
  return { left: Math.round(left), right: Math.round(right), top: Math.round(top), bottom: Math.round(bottom) };
};

const popupEdges = (doc) => {
  const popup = doc.querySelector(POPUP);
  return popup && {
    popup: box(popup),
    panelRight: box(doc.querySelector(SHELL)).right,
    viewport: [doc.defaultView.innerWidth, doc.defaultView.innerHeight],
  };
};

const expectPastPanel = (which, name) => {
  cy.get(POPUP).should("be.visible");
  settledValue(popupEdges).then((edges) => {
    evidence(name, () => edges, { file: "page-popups.json", mask: [appName] });
    const { popup, panelRight, viewport: [width, height] } = edges;
    expect(popup.left, `${which} left vs panel right`).to.be.at.least(panelRight);
    expect(popup.right, `${which} right`).to.be.at.most(width);
    expect(popup.top, `${which} top`).to.be.at.least(0);
    expect(popup.bottom, `${which} bottom`).to.be.at.most(height);
  });
};

const closePopup = () => {
  cy.get("body").type("{esc}");
  cy.get(POPUP).should("not.exist");
};

describe("Page popups", { testIsolation: false }, () => {
  before(() => {
    cy.clearAllLocalStorage();
    seedPanelApp(appName);
    cy.then(() => api("GET", `/apps/${Cypress.env("appId")}`)).then((app) => {
      const pages = `/v2/apps/${app.id}/versions/${app.editing_version.id}/pages`;
      const group = crypto.randomUUID();
      api("POST", pages, { id: group, name: "Group A", handle: "group-a", index: 2, isPageGroup: true, icon: "IconFolder" });
      api("POST", pages, { id: crypto.randomUUID(), name: "Child", handle: "child", index: 3, pageGroupId: group });
      Cypress._.range(4, 20).forEach((index) =>
        api("POST", pages, { id: crypto.randomUUID(), name: `Filler ${index}`, handle: `filler-${index}`, index })
      );
    });
  });
  after(() => cy.apiDeleteApp());

  forEachTheme((theme) =>
    VIEWPORTS.forEach(([width, height]) => {
      const size = `${width}x${height}`;

      it(`[LR-23] page popups open past the Pages panel inside ${size} (${theme})`, () => {
        openEditor(theme, [width, height]);
        openPanel("pages");

        cy.get(".page-group-item").first().click();
        expectPastPanel("Edit group", `page-popup-group.${theme}.${size}`);
        closePopup();

        cy.get('[data-cy="pages-name-second"]').closest(".page-menu-item").as("row").realHover();
        cy.get("@row").find(".action-btn-wrapper .icon-btn").last().click({ force: true });
        cy.contains("#edit-page-popover button", "Edit page details").click();
        expectPastPanel("Edit page details", `page-popup-edit.${theme}.${size}`);
        closePopup();

        cy.get(".add-new-page").click();
        expectPastPanel("New page", `page-popup-new.${theme}.${size}`);
        cy.get('[data-cy="left-sidebar-queries-button"]').click();
        cy.get('[data-cy="left-sidebar-queries-button"]').should("have.class", "sidebar-item--active");
        cy.get(POPUP).should("not.exist");
      });

      it(`[UC-14] New page stays in view under 19 pages and keeps the panel title (${size}, ${theme})`, () => {
        openEditor(theme, [width, height]);
        openPanel("pages");
        cy.get(".page-menu-item").should("have.length.at.least", 20);
        cy.get(".add-new-page").focus();
        settledValue((doc) => ({
          panel: box(doc.querySelector(SHELL)),
          header: box(doc.querySelector(`${SHELL} .tj-panel-header`)),
          button: box(doc.querySelector(".add-new-page")),
        })).then(({ panel, header, button }) => {
          expect(button.top, "New page top").to.be.at.least(panel.top);
          expect(button.bottom, "New page bottom").to.be.at.most(panel.bottom);
          expect(header.top, "panel title stays pinned").to.equal(panel.top);
        });
      });
    })
  );
});
