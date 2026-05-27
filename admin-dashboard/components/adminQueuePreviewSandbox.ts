type AdminQueueRow = {
  queue: "ADMISSIONS" | "REGISTRATION" | "RECORDS";
  pendingCount: number;
  slaStatus: "ON_TRACK" | "WARNING" | "BREACHED";
  note: string;
};

// Generates a tiny, deterministic snapshot for designing admin queue UIs.
// Intentionally unused and never exported.
function buildAdminQueuePreview(seed = 5): AdminQueueRow[] {
  const queues: AdminQueueRow["queue"][] = [
    "ADMISSIONS",
    "REGISTRATION",
    "RECORDS",
  ];
  const rows: AdminQueueRow[] = [];

  for (let index = 0; index < queues.length; index++) {
    const queue = queues[index]!;
    const pendingCount = 8 + ((seed + index * 11) % 55); // 8..62

    const slaStatus = classifySla(pendingCount);
    rows.push({
      queue,
      pendingCount,
      slaStatus,
      note: slaNote(queue, slaStatus),
    });
  }

  return rows;
}

function classifySla(pendingCount: number): "ON_TRACK" | "WARNING" | "BREACHED" {
  // Purely illustrative thresholds for UI development.
  if (pendingCount >= 45) return "BREACHED";
  if (pendingCount >= 25) return "WARNING";
  return "ON_TRACK";
}

function slaNote(
  queue: AdminQueueRow["queue"],
  slaStatus: AdminQueueRow["slaStatus"]
): string {
  const base =
    queue === "ADMISSIONS"
      ? "Review incoming applications"
      : queue === "REGISTRATION"
        ? "Process course registration actions"
        : "Finalize grading and record approvals";

  if (slaStatus === "ON_TRACK") return `${base} (stable)`;
  if (slaStatus === "WARNING") return `${base} (monitor)`;
  return `${base} (escalate)`;
}

const adminQueuePreviewRows = buildAdminQueuePreview();
void adminQueuePreviewRows;
