// UI 2.0 browser QA: fill and containment of every widget on the editor canvas, at two widths and both themes (the
// editor has no phone width; the 390 px case runs in geometryViewer). See ./README.md.
import { geometrySuite } from "Support/utils/appBuilder/ui2/suites";

geometrySuite("editor", { widths: [1600, 1280], themes: ["light", "dark"] });
