import { tq, col } from "./_harness";

// Test-infra workaround (not a product bug): _harness.js's tq.app() reads Cypress.env("appId")
// synchronously as a cy.openApp() call argument, BEFORE this test's own apiCreateApp command has
// actually run. If that env var still holds a PREVIOUS test's (now cleaned-up) app id, cy.openApp()
// opens a dead app and lands on /error/invalid-link. Clearing it first forces cy.openApp()'s own
// `appId = Cypress.env("appId")` default-parameter fallback to kick in, which re-reads the env var
// at real invocation time (after this test's apiCreateApp has completed and set the fresh id).
beforeEach(() => {
  Cypress.env("appId", undefined);
});

// A2 Column types (display): rating, button
// Source refs:
//  - RatingColumn: frontend/src/AppBuilder/Widgets/NewTable/_components/DataTypes/adapters/RatingColumn (Rating.jsx)
//    renders `maxRating` RatingIcon widgets, each role="radio" aria-checked={isSelected}.
//    currentRatingIndex = isEmpty(cellValue) ? defaultRating-1 : (isNaN(Number(cellValue)) ? defaultRating-1 : cellValue-1)
//  - RatingIcon: frontend/src/AppBuilder/Widgets/Rating/RatingIcon.jsx
//  - ButtonColumn: frontend/src/AppBuilder/Widgets/NewTable/_components/DataTypes/adapters/ButtonColumnAdapter.jsx
//    label = buttonLabel || 'Button'; disabled = !!disableButton
//  - ButtonColumnGroupAdapter.jsx: a button is hidden only when buttonVisibility STRICTLY === false.

const stars = () => tq.cell(0, "c").find('[role="radio"]');
const checkedStars = () => tq.cell(0, "c").find('[role="radio"][aria-checked="true"]');

describe("A2 rating column - display", () => {
  afterEach(() => tq.cleanup());

  it("renders exactly maxRating icons regardless of value", () => {
    tq.app({ data: [{ c: 2 }], columns: [col("c", "rating", { maxRating: "{{3}}" })] });
    stars().should("have.length", 3);
  });

  it("value N fills exactly N icons (default maxRating=5)", () => {
    tq.app({ data: [{ c: 3 }], columns: [col("c", "rating")] });
    stars().should("have.length", 5);
    checkedStars().should("have.length", 3);
  });

  it("null value with no defaultRating shows 0 filled icons", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "rating")] });
    checkedStars().should("have.length", 0);
  });

  it("null value falls back to defaultRating", () => {
    tq.app({ data: [{ c: null }], columns: [col("c", "rating", { defaultRating: "{{4}}" })] });
    checkedStars().should("have.length", 4);
  });

  it("undefined value falls back to defaultRating", () => {
    tq.app({ data: [{ c: undefined }], columns: [col("c", "rating", { defaultRating: "{{2}}" })] });
    checkedStars().should("have.length", 2);
  });

  it("value 0 shows 0 filled icons (not defaultRating)", () => {
    tq.app({ data: [{ c: 0 }], columns: [col("c", "rating", { defaultRating: "{{4}}" })] });
    checkedStars().should("have.length", 0);
  });

  it("wrong type (non-numeric string) falls back to defaultRating, no crash", () => {
    tq.app({ data: [{ c: "abc" }], columns: [col("c", "rating", { defaultRating: "{{2}}" })] });
    checkedStars().should("have.length", 2);
  });

  it("value greater than maxRating fills all icons, no crash", () => {
    tq.app({ data: [{ c: 99 }], columns: [col("c", "rating", { maxRating: "{{5}}" })] });
    checkedStars().should("have.length", 5);
  });

  it("negative value shows 0 filled icons, no crash", () => {
    tq.app({ data: [{ c: -3 }], columns: [col("c", "rating")] });
    checkedStars().should("have.length", 0);
  });
});

describe("A2 button column - display", () => {
  afterEach(() => tq.cleanup());

  it("renders the configured label", () => {
    tq.app({
      data: [{ c: "x" }],
      columns: [col("c", "button", { buttons: [{ id: "b1", buttonLabel: "{{'Approve'}}" }] })],
    });
    tq.cell(0, "c").find("button").should("contain.text", "Approve");
  });

  it("missing/empty label falls back to the literal \"Button\"", () => {
    tq.app({
      data: [{ c: "x" }],
      columns: [col("c", "button", { buttons: [{ id: "b1", buttonLabel: "{{''}}" }] })],
    });
    tq.cell(0, "c").find("button").should("contain.text", "Button");
  });

  it("buttonVisibility=false hides the button", () => {
    tq.app({
      data: [{ c: "x" }],
      columns: [col("c", "button", { buttons: [{ id: "b1", buttonLabel: "{{'X'}}", buttonVisibility: "{{false}}" }] })],
    });
    tq.cell(0, "c").find("button").should("not.exist");
  });

  it("buttonVisibility as a falsy-but-not-boolean value (0) still SHOWS the button " +
     "(visibility check is a strict === false, not a truthiness check)", () => {
    tq.app({
      data: [{ c: "x" }],
      columns: [col("c", "button", { buttons: [{ id: "b1", buttonLabel: "{{'X'}}", buttonVisibility: "{{0}}" }] })],
    });
    tq.cell(0, "c").find("button").should("exist").and("contain.text", "X");
  });

  it("disableButton disables the button", () => {
    tq.app({
      data: [{ c: "x" }],
      columns: [col("c", "button", { buttons: [{ id: "b1", buttonLabel: "{{'X'}}", disableButton: "{{true}}" }] })],
    });
    tq.cell(0, "c").find("button").should("be.disabled");
  });
});
