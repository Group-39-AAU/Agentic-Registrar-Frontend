"use client";

import { useState } from "react";
import AdmissionApplicationForm from "./AdmissionApplicationForm";
import AdmissionTerms from "./AdmissionTerms";

export default function AdmissionApplyClient() {
  const [selectedTermId, setSelectedTermId] = useState("");

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-[#1a1a1a]">Admission Application</h1>
          <p className="text-[14px] text-[#5a5a5a]">
            Please fill in all the required details to complete your application.
          </p>
        </div>
        <AdmissionTerms value={selectedTermId} onChange={setSelectedTermId} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="px-10 py-10">
          <AdmissionApplicationForm admissionTermId={selectedTermId} />
        </div>
      </div>
    </>
  );
}
