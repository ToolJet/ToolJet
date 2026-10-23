// UI 2.0 browser QA: fill and containment of every widget in the viewer (preview), at three widths and both themes.
// See ./README.md.
import { geometrySuite } from "Support/utils/appBuilder/ui2/suites";

geometrySuite("viewer", { widths: [1600, 1280, 390], themes: ["light", "dark"] });
