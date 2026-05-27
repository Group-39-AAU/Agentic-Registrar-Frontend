/**
 * Demo-only utility for populating grade scores without manual entry.
 * Results are staged client-side; the presenter still submits them via
 * the normal "Save → Submit" flow to trigger the GradingMonitorAgent.
 *
 * Mode → intended agent anomaly detector:
 *   realistic → none (baseline APPROVE)
 *   generous / harsh / bimodal → distribution-shape detector
 *   identical → identical-cluster surfacer
 *   outliers → z-score outlier detector
 */

export type DemoFillMode =
  | "realistic"
  | "generous"
  | "harsh"
  | "bimodal"
  | "identical"
  | "outliers"
  | "clear";

export type DemoComponent = {
  id: string;
  max_score: number;
};

export type DemoStudent = {
  student_id: string;
};

export type DemoScoresMap = Record<string, Record<string, string>>;

export type DemoFillResult = {
  scores: DemoScoresMap;
  /** Plain-English summary the UI can flash so the presenter knows what they applied. */
  note: string;
};

const MODE_LABEL: Record<DemoFillMode, string> = {
  realistic: "Realistic spread",
  generous: "Grade inflation",
  harsh: "Many failures",
  bimodal: "Bimodal split",
  identical: "Identical scores",
  outliers: "Outlier(s)",
  clear: "Clear all",
};

const MODE_HINT: Record<DemoFillMode, string> = {
  realistic: "Natural ~N(78, 8). Expect APPROVE.",
  generous: "Everyone 88–100. Expect FLAG (grade inflation).",
  harsh: "Most below 50. Expect FLAG (high fail rate).",
  bimodal: "Half ~90, half ~45. Expect FLAG (bimodal shape).",
  identical: "Every student exactly 75%. Expect FLAG (identical cluster).",
  outliers: "Most ~72, but one 0 and one 100. Expect FLAG (z-score outliers).",
  clear: "Wipes all entered scores in the UI (no backend call).",
};

/** Short display label for a demo fill mode (e.g. shown in a dropdown). */
export function modeLabel(mode: DemoFillMode): string {
  return MODE_LABEL[mode];
}

/** One-line tooltip describing what the agent is expected to do for this mode. */
export function modeHint(mode: DemoFillMode): string {
  return MODE_HINT[mode];
}

/** Box-Muller normal sample. */
function normal(mean: number, stddev: number): number {
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + stddev * z;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Per-student target percentage in [0, 100] for a given mode. */
function targetPercentages(mode: DemoFillMode, n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    switch (mode) {
      case "realistic":
        out.push(clamp(normal(78, 8), 35, 98));
        break;
      case "generous":
        out.push(clamp(normal(93, 3.5), 85, 100));
        break;
      case "harsh":
        out.push(clamp(normal(45, 10), 5, 75));
        break;
      case "bimodal":
        out.push(
          i < Math.ceil(n / 2)
            ? clamp(normal(90, 3), 80, 100)
            : clamp(normal(45, 4), 25, 60),
        );
        break;
      case "identical":
        out.push(75);
        break;
      case "outliers":
        if (i === 0) out.push(100);
        else if (i === n - 1) out.push(0);
        else out.push(clamp(normal(72, 6), 50, 90));
        break;
      case "clear":
        out.push(0); // unused — fillScores short-circuits
        break;
    }
  }
  return out;
}

/** Tiny per-(student, component) jitter so components aren't perfectly identical. */
function jitterFor(mode: DemoFillMode): number {
  switch (mode) {
    case "identical":
      return 0;
    case "outliers":
      return 1; // very tight — outliers should stand out cleanly
    case "generous":
      return 1.5;
    case "bimodal":
      return 1.5;
    case "harsh":
      return 2.5;
    case "realistic":
      return 3;
    case "clear":
      return 0;
  }
}

/**
 * Generates a complete (student × component) score map for the given mode.
 * `"clear"` returns all-blank cells; all other modes produce numeric strings.
 */
export function buildDemoScores(
  mode: DemoFillMode,
  students: DemoStudent[],
  components: DemoComponent[],
): DemoFillResult {
  const scores: DemoScoresMap = {};

  if (mode === "clear") {
    for (const s of students) {
      const row: Record<string, string> = {};
      for (const c of components) row[c.id] = "";
      scores[s.student_id] = row;
    }
    return { scores, note: `${modeLabel(mode)}: ${modeHint(mode)}` };
  }

  const targets = targetPercentages(mode, students.length);
  const j = jitterFor(mode);

  for (let i = 0; i < students.length; i++) {
    const stu = students[i];
    const target = targets[i];
    const row: Record<string, string> = {};

    if (mode === "outliers" && (i === 0 || i === students.length - 1)) {
      // Force the outlier students to the same extreme on every
      // component so the agent sees a clean z-score outlier rather
      // than a noisy one.
      const forced = i === 0 ? 100 : 0;
      for (const c of components) {
        const raw = (forced / 100) * c.max_score;
        row[c.id] = String(Math.round(raw));
      }
    } else {
      for (const c of components) {
        const pct = clamp(
          j === 0 ? target : target + (Math.random() * 2 - 1) * j,
          0,
          100,
        );
        const raw = (pct / 100) * c.max_score;
        const rounded = clamp(Math.round(raw), 0, c.max_score);
        row[c.id] = String(rounded);
      }
    }

    scores[stu.student_id] = row;
  }

  return { scores, note: `${modeLabel(mode)}: ${modeHint(mode)}` };
}

export const DEMO_FILL_MODES: DemoFillMode[] = [
  "realistic",
  "generous",
  "harsh",
  "bimodal",
  "identical",
  "outliers",
  "clear",
];
