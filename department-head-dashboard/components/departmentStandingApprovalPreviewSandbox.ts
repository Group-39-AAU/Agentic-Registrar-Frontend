type StandingApprovalRow = {
  termId: string;
  termName: string;
  status: "PROMOTED" | "WARNING" | "DISTINCTION" | "DISMISSED" | "INCOMPLETE";
  authorisedBy: string | null;
  approvedAt: string | null;
  explanationPreview: string;
};

// Isolated preview data for the department-head "standing approval" UI.
// No exports, no imports, and no side effects beyond local constants.
function buildStandingApprovalPreviewRows(): StandingApprovalRow[] {
  const approved = [
    {
      termId: "TERM-AP-2025-1",
      termName: "Academic Year 2025 / Term 1",
      status: "DISTINCTION" as const,
      authorisedBy: "Dept Head (Preview)",
      approvedAt: "2025-10-01",
      explanationPreview: "Threshold met across components; no overrides required.",
    },
    {
      termId: "TERM-AP-2025-2",
      termName: "Academic Year 2025 / Term 2",
      status: "PROMOTED" as const,
      authorisedBy: "Dept Head (Preview)",
      approvedAt: "2026-01-15",
      explanationPreview: "Credit hours and SGPA targets satisfied for progression.",
    },
  ];

  const pending = [
    {
      termId: "TERM-AP-2026-1",
      termName: "Academic Year 2026 / Term 1",
      status: "WARNING" as const,
      authorisedBy: null,
      approvedAt: null,
      explanationPreview:
        "Some courses require review; approval pending department-side authorisation.",
    },
    {
      termId: "TERM-AP-2026-2",
      termName: "Academic Year 2026 / Term 2",
      status: "INCOMPLETE" as const,
      authorisedBy: null,
      approvedAt: null,
      explanationPreview: "Missing component submissions; awaiting final grading confirmation.",
    },
  ];

  return [...approved, ...pending];
}

const standingApprovalPreviewRows = buildStandingApprovalPreviewRows();
const _hasPending = standingApprovalPreviewRows.some(
  (r) => r.authorisedBy === null
);
void _hasPending;
