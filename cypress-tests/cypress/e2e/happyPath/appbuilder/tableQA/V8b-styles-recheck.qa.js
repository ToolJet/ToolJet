// Re-check V8 ambiguities by locating the deepest element that contains the value text.
import { tq, col, OPTS, recorder } from "./_obs";
const R = recorder("v8b-results.json");
const textColorOf = (doc, c, needle) => {
  const td = doc.querySelector(`td[data-cy="table1-${c}-row-0"]`);
  if (!td) return "NO TD";
  const els = [...td.querySelectorAll("*")].filter((e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.includes(needle)));
  const inp = [...td.querySelectorAll("input")].find((i) => String(i.value).includes(needle));
  const el = els[0] || inp;
  return el ? `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} ${getComputedStyle(el).color}` : "NOT FOUND";
};
describe("V8b style re-checks", () => {
  afterEach(() => tq.cleanup());
  after(() => R.flush());
  it("text colour on the element holding the value, editable and read-only", () => {
    const T = [["s", "string", "hello"], ["n", "number", 5], ["d", "datepicker", "15/05/2026"], ["sel", "select", "red"], ["m", "newMultiSelect", ["red"]], ["t", "tagsV2", ["red"]]];
    const row = {}; T.forEach(([k, , v]) => { row[k] = v; row[k + "E"] = v; });
    const cols = [];
    T.forEach(([k, t]) => {
      const extra = { options: OPTS, dateFormat: "DD/MM/YYYY", parseDateFormat: "DD/MM/YYYY", textColor: "#ff0000", allowMultipleSelection: true };
      cols.push(col(k, t, extra)); cols.push(col(k + "E", t, { ...extra, isEditable: true }));
    });
    tq.app({ data: [row], columns: cols, width: 60, props: { defaultSelectedRow: "{{undefined}}" } });
    cy.document().then((doc) => T.forEach(([k, t, v]) => {
      const needle = t === "select" || t === "newMultiSelect" || t === "tagsV2" ? "Red" : String(v);
      R.push({ id: `${t}:readonly`, got: textColorOf(doc, k, needle) });
      R.push({ id: `${t}:editable`, got: textColorOf(doc, k + "E", needle) });
    }));
  });
  it("boolean toggle colours (read-only and editable), image radius, tags sort with multi on, select auto colours", () => {
    tq.app({
      data: [{ b1: true, b2: false, b3: true, i: "https://reqres.in/img/faces/7-image.jpg", ta: ["green", "red", "blue"], tz: ["green", "red", "blue"], s1: "red", s2: "red" }],
      width: 60,
      columns: [col("b1", "boolean", { toggleOnBg: "#ff0000" }), col("b2", "boolean", { toggleOffBg: "#00ff00" }), col("b3", "boolean", { toggleOnBg: "#ff0000", isEditable: true }),
        col("i", "image", { borderRadius: "{{20}}", objectFit: "cover" }),
        col("ta", "tagsV2", { options: OPTS, allowMultipleSelection: true, sortTags: "a-z" }), col("tz", "tagsV2", { options: OPTS, allowMultipleSelection: true, sortTags: "z-a" }),
        col("s1", "select", { options: OPTS, autoAssignColors: true }), col("s2", "select", { options: OPTS, autoAssignColors: false })],
      props: { defaultSelectedRow: "{{undefined}}" },
    });
    cy.document().then((doc) => {
      const td = (c) => doc.querySelector(`td[data-cy="table1-${c}-row-0"]`);
      const bgs = (c) => [...td(c).querySelectorAll("*")].map((e) => getComputedStyle(e).backgroundColor).filter((b) => b !== "rgba(0, 0, 0, 0)");
      R.push({ id: "boolean:readonly on red", html: td("b1").innerHTML.replace(/<path[^>]*>|<\/?svg[^>]*>/g, "").slice(0, 220), bgs: bgs("b1") });
      R.push({ id: "boolean:readonly off green", bgs: bgs("b2") });
      R.push({ id: "boolean:editable on red", bgs: bgs("b3") });
      R.push({ id: "image:radius20", radii: [...td("i").querySelectorAll("*")].map((e) => e.tagName + ":" + getComputedStyle(e).borderRadius) });
      R.push({ id: "tags:a-z", text: td("ta").innerText.replace(/\s+/g, " ") });
      R.push({ id: "tags:z-a", text: td("tz").innerText.replace(/\s+/g, " ") });
      R.push({ id: "select:auto on", bgs: bgs("s1") });
      R.push({ id: "select:auto off", bgs: bgs("s2") });
    });
  });
});
