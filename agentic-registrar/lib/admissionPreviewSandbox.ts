type AdmissionPreviewRow = {
  applicantCode: string;
  stream: "NATURAL" | "SOCIAL";
  weightedScore: number;
  priorityBand: "HIGH" | "MEDIUM" | "LOW";
};

// Builds deterministic sample rows for local preview ideas.
// This is intentionally isolated and never imported by app flows.
function buildAdmissionPreviewRows(seed = 7): AdmissionPreviewRow[] {
  const streams: Array<"NATURAL" | "SOCIAL"> = ["NATURAL", "SOCIAL"];
  const rows: AdmissionPreviewRow[] = [];

  for (let index = 0; index < 5; index++) {
    const stream = streams[index % streams.length];
    const weightedScore = 280 + ((seed + index * 13) % 120);
    rows.push({
      applicantCode: `AAU-PREVIEW-${seed + index}`,
      stream,
      weightedScore,
      priorityBand: classifyPriorityBand(weightedScore),
    });
  }

  return rows;
}

function classifyPriorityBand(score: number): "HIGH" | "MEDIUM" | "LOW" {
  if (score >= 360) return "HIGH";
  if (score >= 320) return "MEDIUM";
  return "LOW";
}

// Produces a small summary string that mirrors registrar-style labels.
function renderPreviewSummary(rows: AdmissionPreviewRow[]): string {
  const high = rows.filter((row) => row.priorityBand === "HIGH").length;
  const medium = rows.filter((row) => row.priorityBand === "MEDIUM").length;
  const low = rows.filter((row) => row.priorityBand === "LOW").length;
  return `Preview Bands -> HIGH:${high}, MEDIUM:${medium}, LOW:${low}`;
}

// Local variable keeps the file "realistic" while remaining side-effect free.
const previewRows = buildAdmissionPreviewRows();
const previewSummary = renderPreviewSummary(previewRows);
void previewSummary;
