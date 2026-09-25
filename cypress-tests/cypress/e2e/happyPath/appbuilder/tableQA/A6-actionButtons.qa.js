// A6: Action buttons (props.actions — position left/right, text, colors, disabled fx)
// and the Button column type. A click must:
//   1) expose `selectedRow`/`selectedRowId` for the clicked row BEFORE the handler runs
//      (ActionButtons.jsx handleActionClick / generateColumnsData.js button onClick)
//   2) fire the corresponding internal event exactly once.
import { tq, col } from "./_harness";

const data = [
  { id: 1, name: "Sarah", status: "active" },
  { id: 2, name: "Lisa", status: "inactive" },
  { id: 3, name: "Sam", status: "active" },
];
const columns = [col("id"), col("name"), col("status")];

describe("A6 action buttons (props.actions)", () => {
  afterEach(() => tq.cleanup());

  it("renders left and right action columns per `position`, with the given button text/colors", () => {
    tq.app({
      data,
      columns,
      props: {
        actions: [
          { name: "left1", buttonText: "Preview", position: "left", backgroundColor: "#ff0000", textColor: "#ffffff", events: [] },
          { name: "right1", buttonText: "Approve", position: "right", backgroundColor: "#00ff00", textColor: "#000000", events: [] },
        ],
      },
    });
    tq.table()
      .find("thead th")
      .first()
      .should("contain.text", "Actions"); // left action column is the FIRST column
    tq.table().find("tbody tr").eq(0).find("button.action-button").eq(0).should("have.text", "Preview");
    tq.table()
      .find("tbody tr")
      .eq(0)
      .find("button.action-button")
      .last()
      .should("have.text", "Approve")
      .and("have.css", "background-color", "rgb(0, 255, 0)");
  });

  it("clicking an action button exposes selectedRow/selectedRowId for THAT row before firing", () => {
    tq.app({
      data,
      columns,
      props: { actions: [{ name: "a1", buttonText: "Pick", position: "right", events: [] }] },
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
        srid: "{{components.table1.selectedRowId}}",
      },
    });
    tq.table().find("tbody tr").eq(1).find("button.action-button").click({ force: true });
    tq.probe("sr").should("contain.text", "Lisa");
    tq.probe("srid").should("have.text", "1");
  });

  it("disableActionButton fx disables the button per-row", () => {
    tq.app({
      data,
      columns,
      props: {
        actions: [
          {
            name: "a1",
            buttonText: "Approve",
            position: "right",
            events: [],
            disableActionButton: "{{rowData.status === 'inactive'}}",
          },
        ],
      },
    });
    tq.table().find("tbody tr").eq(0).find("button.action-button").should("not.be.disabled"); // Sarah/active
    tq.table().find("tbody tr").eq(1).find("button.action-button").should("be.disabled"); // Lisa/inactive
  });

  it("an empty `actions` array renders no action column (no leftover empty header)", () => {
    tq.app({ data, columns, props: { actions: [] } });
    tq.table().find("thead th").should("not.contain.text", "Actions");
  });
});

describe("A6 Button column type", () => {
  afterEach(() => tq.cleanup());

  it("renders one button per configured entry and reflects buttonLabel/buttonType", () => {
    tq.app({
      data,
      columns: [
        col("id"),
        col("name"),
        col("actionsCol", "button", {
          name: "Actions",
          buttons: [
            { id: "b1", buttonLabel: "Edit", buttonType: "solid" },
            { id: "b2", buttonLabel: "Delete", buttonType: "outline" },
          ],
        }),
      ],
    });
    tq.cell(0, "Actions").find("button").should("have.length", 2);
    tq.cell(0, "Actions").find("button").eq(0).should("have.text", "Edit");
    tq.cell(0, "Actions").find("button").eq(1).should("have.text", "Delete");
  });

  it("clicking a button-column button exposes selectedRow/selectedRowId for that row", () => {
    tq.app({
      data,
      columns: [
        col("id"),
        col("name"),
        col("actionsCol", "button", { name: "Actions", buttons: [{ id: "b1", buttonLabel: "Edit" }] }),
      ],
      probes: {
        sr: "{{JSON.stringify(components.table1.selectedRow)}}",
        srid: "{{components.table1.selectedRowId}}",
      },
    });
    tq.cell(2, "Actions").find("button").click({ force: true });
    tq.probe("sr").should("contain.text", "Sam");
    tq.probe("srid").should("have.text", "2");
  });

  it("disableButton fx disables the button per-row via row context", () => {
    tq.app({
      data,
      columns: [
        col("id"),
        col("name"),
        col("status"),
        col("actionsCol", "button", {
          name: "Actions",
          buttons: [{ id: "b1", buttonLabel: "Approve", disableButton: "{{rowData.status === 'inactive'}}" }],
        }),
      ],
    });
    tq.cell(0, "Actions").find("button").should("not.be.disabled");
    tq.cell(1, "Actions").find("button").should("be.disabled");
  });

  it("buttonVisibility fx hides individual buttons per row without removing the column", () => {
    tq.app({
      data,
      columns: [
        col("id"),
        col("name"),
        col("status"),
        col("actionsCol", "button", {
          name: "Actions",
          buttons: [{ id: "b1", buttonLabel: "Reactivate", buttonVisibility: "{{rowData.status === 'inactive'}}" }],
        }),
      ],
    });
    tq.cell(0, "Actions").find("button").should("have.length", 0); // active row: hidden
    tq.cell(1, "Actions").find("button").should("have.length", 1).and("be.visible"); // inactive row: shown
  });
});
