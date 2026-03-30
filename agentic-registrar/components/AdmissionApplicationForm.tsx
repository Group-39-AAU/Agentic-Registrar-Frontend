"use client";

import React, { useState } from "react";
import { FormInput, FormSelect } from "./AdmissionFormFields";

export default function AdmissionApplicationForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    admissionType: "", // Regular, Extension, E-learning
    studyTrack: "", // Government, Self-sponsored
    admissionNumber: "",
    programs: ["", "", ""],
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="h-16 w-16 rounded-full bg-green-100 p-3 text-green-600">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-[#2a2a2a]">Application Submitted!</h2>
        <p className="mt-2 text-[14px] text-[#5a5a5a]">
          Your application has been received and is being processed by the Eligibility & Ranking Agent.
          Wait for UAT test scheduling via this portal.
        </p>
        <button
          onClick={() => window.location.href = "/admissions/my-admissions"}
          className="mt-8 rounded-md bg-[#3f79b5] px-6 py-2 text-white transition-colors hover:bg-[#356e9f]"
        >
          View My Admissions
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full border-2 grid place-items-center text-[12px] font-bold ${
                step >= s ? "bg-[#3f79b5] border-[#3f79b5] text-white" : "bg-white border-gray-300 text-gray-400"
              }`}
            >
              {s}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= s ? "text-[#3f79b5]" : "text-gray-400"}`}>
              {s === 1 ? "Type" : s === 2 ? "Programs" : "Academic"}
            </span>
            {s < 3 && <div className="h-[1px] w-8 bg-gray-200" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5">
              <FormSelect
                label="Admission Type"
                name="admissionType"
                required
                options={[
                  { value: "regular", label: "Regular" },
                  { value: "extension", label: "Extension" },
                  { value: "elearning", label: "E-Learning" },
                ]}
                onChange={(e) => setFormData({ ...formData, admissionType: e.target.value })}
              />
              <FormSelect
                label="Study Track"
                name="studyTrack"
                required
                options={[
                  { value: "government", label: "Government Sponsored" },
                  { value: "self", label: "Self-Sponsored" },
                ]}
                onChange={(e) => setFormData({ ...formData, studyTrack: e.target.value })}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="h-[40px] px-8 rounded-md bg-[#3f79b5] text-white font-semibold transition-colors hover:bg-[#356e9f]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <h3 className="text-[14px] font-bold text-[#3a3a3a]">Program Preferences</h3>
              {formData.studyTrack === "government" ? (
                <div className="space-y-4">
                  <FormSelect
                    label="Choice"
                    options={[
                      { value: "natural", label: "Natural Science" },
                      { value: "social", label: "Social Science" },
                    ]}
                    onChange={() => {}}
                  />
                </div>
              ) : (
                <>
                  <FormSelect
                    label="Choice 1"
                    options={[
                      { value: "cs", label: "Computer Science" },
                      { value: "med", label: "Medicine (Special Assessment)" },
                      { value: "eng", label: "Software Engineering" }
                    ]}
                    onChange={() => {}}
                  />
                  <FormSelect
                    label="Choice 2"
                    options={[{ value: "ee", label: "Electrical Engineering" }, { value: "pharm", label: "Pharmacy (Special Assessment)" }]}
                    onChange={() => {}}
                  />
                  <FormSelect
                    label="Choice 3"
                    options={[{ value: "civil", label: "Civil Engineering" }, { value: "art", label: "Visual Arts" }]}
                    onChange={() => {}}
                  />
                </>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button type="button" onClick={handleBack} className="h-[40px] px-8 rounded-md border border-gray-300 text-gray-600 font-semibold">
                Back
              </button>
              <button type="button" onClick={handleNext} className="h-[40px] px-8 rounded-md bg-[#3f79b5] text-white font-semibold transition-colors hover:bg-[#356e9f]">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-5">
              <FormInput
                label="Admission Number"
                placeholder="e.g. 123456"
                required
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
              />
            </div>

            <div className="mt-6 flex justify-between">
              <button type="button" onClick={handleBack} className="h-[40px] px-8 rounded-md border border-gray-300 text-gray-600 font-semibold">
                Back
              </button>
              <button type="submit" className="h-[40px] px-8 rounded-md bg-[#3f79b5] text-white font-semibold transition-colors hover:bg-[#356e9f]">
                Final Submission
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
