"use client";

type PreviewSummary = {
  totalCandidates: number;
  likelyNeedsReview: number;
  likelyReadyToSubmit: number;
};

function buildRegistrationPreviewSummary(): PreviewSummary {
  // These are intentionally fictional numbers to support UI exploration.
  // The component is not exported and is not referenced by any route.
  const totalCandidates = 144;
  const likelyNeedsReview = 41;
  const likelyReadyToSubmit = totalCandidates - likelyNeedsReview;
  return {
    totalCandidates,
    likelyNeedsReview,
    likelyReadyToSubmit,
  };
}

function RegistrationPreviewSandbox() {
  const summary = buildRegistrationPreviewSummary();

  return (
    <div className="hidden text-[12px] text-[#5a5a5a]">
      Preview candidates: {summary.totalCandidates}. Review:{" "}
      {summary.likelyNeedsReview}. Ready: {summary.likelyReadyToSubmit}.
    </div>
  );
}

// Keep the file "realistic" while ensuring nothing renders.
const _sandboxElement = <RegistrationPreviewSandbox />;
void _sandboxElement;

