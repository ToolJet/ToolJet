// Styles for every column type: common (textColor, cellBackgroundColor, horizontalAlignment, pin, size) + type-specific. Observe-only.
import { tq, col, OPTS, recorder, styleOf, cellFacts } from "./_obs";

const R = recorder("v8-results.json");
const RED = "rgb(255, 0, 0)", GREEN = "rgb(0, 255, 0)";
const build = (row, columns, props = {}) => tq.app({ data: [row], columns, width: 40, props: { defaultSelectedRow: "{{undefined}}", ...props } });
const rec = (id, colName, inner, expect) => cy.document().then((doc) => R.push({ id, expect, style: styleOf(doc, colName, inner), cell: cellFacts(doc, colName) }));

// Types with textColor / cellBackgroundColor / horizontalAlignment, and the element that carries the text.
const COMMON = [
  ["string", "hello", ".long-text-input, span"],
  ["number", 5, "input"],
  ["text", "long text", ".long-text-input, span"],
  ["datepicker", "15/05/2026", "input"],
  ["select", "red", ".react-select__single-value, .react-select__control"],
  ["newMultiSelect", ["red"], ".react-select__multi-value, .react-select__control"],
  ["tagsV2", ["red"], "[class*=tag], .react-select__control"],
  ["json", { a: 1 }, ".long-text-input, span"],
  ["markdown", "plain", ".long-text-input, p"],
  ["html", "plain", ".long-text-input, span"],
  ["boolean", true, "label"],
  ["link", "https://tooljet.com", "a"],
  ["rating", 3, ".rating-widget-group"],
  ["image", "https://reqres.in/img/faces/7-image.jpg", "img"],
];

describe("V8 styles, every column type", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());

  // one app per alignment value: each type gets textColor red, cell bg green, alignment X
  ["center", "right"].forEach((align) =>
    it(`common styles on every type (align ${align})`, () => {
      const row = {}; COMMON.forEach(([t, v], i) => (row[`c${i}`] = v));
      build(row, COMMON.map(([t], i) => col(`c${i}`, t, { options: OPTS, dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", textColor: "#ff0000", cellBackgroundColor: "#00ff00", horizontalAlignment: align })));
      COMMON.forEach(([t, , inner], i) => {
        rec(`${t}:td[${align}]`, `c${i}`, null, { bg: GREEN, align });
        rec(`${t}:text[${align}]`, `c${i}`, inner, { color: RED });
        cy.document().then((doc) => {
          // which descendant actually carries alignment (justify-content or text-align)?
          const td = doc.querySelector(`td[data-cy="table1-c${i}-row-0"]`);
          const hits = td ? [...td.querySelectorAll("*")].map((e) => getComputedStyle(e)).filter((s) => s.justifyContent === (align === "right" ? "flex-end" : "center") || s.textAlign === align).length : 0;
          R.push({ id: `${t}:alignHits[${align}]`, hits });
        });
      });
    })
  );

  it("type-specific: boolean toggle colours", () => {
    build({ on: true, off: false }, [col("on", "boolean", { toggleOnBg: "#ff0000" }), col("off", "boolean", { toggleOffBg: "#00ff00" })]);
    rec("boolean:toggleOnBg", "on", ".boolean-slider", { bg: RED });
    rec("boolean:toggleOffBg", "off", ".boolean-slider", { bg: GREEN });
  });

  it("type-specific: link colour, underline colour, underline always, display text, target", () => {
    build(
      { l: "https://tooljet.com", l2: "https://tooljet.com" },
      [col("l", "link", { linkColor: "#ff0000", underlineColor: "#00ff00", underline: "always", displayText: "Visit" }), col("l2", "link", { linkTarget: "{{false}}" })]
    );
    rec("link:colors+underline", "l", "a", { color: RED, textDecoration: "underline", decorationColor: GREEN, text: "Visit" });
    cy.document().then((doc) => {
      R.push({ id: "link:target(default)", target: doc.querySelector('td[data-cy="table1-l-row-0"] a')?.getAttribute("target") });
      R.push({ id: "link:target(off)", target: doc.querySelector('td[data-cy="table1-l2-row-0"] a')?.getAttribute("target") });
    });
  });

  it("type-specific: rating icon, max, half star, colours", () => {
    build(
      { a: 3, b: 7, c: 2.5, d: 2 },
      [col("a", "rating", { iconType: "hearts", selectedBgColorHearts: "#ff0000" }), col("b", "rating", { maxRating: "{{10}}" }),
        col("c", "rating", { allowHalfStar: "{{true}}" }), col("d", "rating", { selectedBgColorStars: "#00ff00", unselectedBgColor: "#ff0000" })]
    );
    cy.document().then((doc) => {
      const icons = (c) => [...doc.querySelectorAll(`td[data-cy="table1-${c}-row-0"] .rating-icon-widget`)];
      const svgFill = (el) => { const p = el && el.querySelector("path, svg"); return p ? getComputedStyle(p).fill + "|" + (p.getAttribute("fill") || "") : null; };
      R.push({ id: "rating:hearts", count: icons("a").length, firstFill: svgFill(icons("a")[0]), html: (icons("a")[0]?.innerHTML || "").slice(0, 120) });
      R.push({ id: "rating:max10 value7", count: icons("b").length });
      R.push({ id: "rating:halfStar 2.5", html: doc.querySelector('td[data-cy="table1-c-row-0"]')?.innerHTML.replace(/<path[^>]*>/g, "").slice(0, 300) });
      R.push({ id: "rating:colours sel=green unsel=red", sel: svgFill(icons("d")[0]), unsel: svgFill(icons("d")[4]) });
    });
  });

  it("type-specific: image radius + fit, number decimals, json indentation", () => {
    build(
      { i: "https://reqres.in/img/faces/7-image.jpg", n: 3.14159, j: { a: 1, b: [1, 2] }, j2: { a: 1 } },
      [col("i", "image", { borderRadius: "{{20}}", objectFit: "cover" }), col("n", "number", { decimalPlaces: "{{2}}" }),
        col("j", "json", { jsonIndentation: "{{true}}" }), col("j2", "json", { jsonIndentation: "{{false}}" })]
    );
    rec("image:radius20+cover", "i", "img", { radius: "20px", objectFit: "cover" });
    rec("number:decimals2", "n", "input", { input: "3.14" });
    cy.document().then((doc) => {
      R.push({ id: "json:indent on", text: doc.querySelector('td[data-cy="table1-j-row-0"]')?.innerText });
      R.push({ id: "json:indent off", text: doc.querySelector('td[data-cy="table1-j2-row-0"]')?.innerText });
    });
  });

  it("type-specific: tags sort a-z / z-a, single selection, auto colours; select auto colours", () => {
    build(
      { a: ["green", "red", "blue"], b: ["green", "red", "blue"], c: ["red", "green"], d: "red" },
      [col("a", "tagsV2", { options: OPTS, sortTags: "a-z" }), col("b", "tagsV2", { options: OPTS, sortTags: "z-a" }),
        col("c", "tagsV2", { options: OPTS, allowMultipleSelection: false }), col("d", "select", { options: OPTS, autoAssignColors: true })]
    );
    cy.document().then((doc) => {
      const txt = (c) => doc.querySelector(`td[data-cy="table1-${c}-row-0"]`)?.innerText.replace(/\s+/g, " ").trim();
      R.push({ id: "tags:sort a-z", text: txt("a"), expect: "Blue Green Red" });
      R.push({ id: "tags:sort z-a", text: txt("b"), expect: "Red Green Blue" });
      R.push({ id: "tags:single selection with 2 values", text: txt("c") });
      const chip = doc.querySelector('td[data-cy="table1-d-row-0"] .react-select__single-value, td[data-cy="table1-d-row-0"] [class*=singleValue]');
      R.push({ id: "select:autoAssignColors", bg: chip ? getComputedStyle(chip).backgroundColor : null, text: txt("d") });
    });
  });

  it("pin left/right, column size, fx colours per row", () => {
    const row = (i) => ({ id: i, a: `a${i}`, b: `b${i}`, c: `c${i}`, d: `d${i}`, e: `e${i}` });
    tq.app({
      data: [row(1), row(2)], width: 20,
      columns: [col("id"), col("a", "string", { pinPosition: "left" }), col("b", "string", { columnSize: 300 }), col("c"), col("d"), col("e", "string", { pinPosition: "right", textColor: "{{rowData.id === 1 ? '#ff0000' : '#00ff00'}}" })],
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.document().then((doc) => {
      const st = (c, r = 0) => { const td = doc.querySelector(`td[data-cy="table1-${c}-row-${r}"]`); if (!td) return null; const s = getComputedStyle(td); return { position: s.position, left: s.left, right: s.right, width: s.width }; };
      R.push({ id: "pin:left", s: st("a") });
      R.push({ id: "pin:right", s: st("e") });
      R.push({ id: "size:300", s: st("b") });
      const color = (r) => { const td = doc.querySelector(`td[data-cy="table1-e-row-${r}"]`); const el = td && (td.querySelector(".long-text-input, span") || td); return el ? getComputedStyle(el).color : null; };
      R.push({ id: "fxTextColor row1 red / row2 green", r1: color(0), r2: color(1) });
    });
  });
});
