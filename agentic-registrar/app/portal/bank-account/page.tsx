"use client";
import StubPage from "@/components/StubPage";

export default function Page() {
  return (
    <StubPage
      title="Bank Account"
      subtitle="Banking details on file for refunds and disbursements"
      variant="form"
      intro="Keep your bank details up to date so the registrar can issue refunds or stipend payments without delay."
      fields={[
        { label: "Bank name", placeholder: "e.g. Commercial Bank of Ethiopia", required: true },
        { label: "Branch", placeholder: "e.g. Sidist Kilo branch" },
        { label: "Account holder", placeholder: "Full name on the account", required: true },
        { label: "Account number", placeholder: "10–16 digit account number", required: true },
        { label: "SWIFT / IBAN", placeholder: "Only for foreign transfers" },
      ]}
      ctaLabel="Save details"
    />
  );
}
