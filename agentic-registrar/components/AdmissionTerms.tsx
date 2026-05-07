"use client";

import { useEffect, useState } from "react";
import { admissionTerm } from "../lib/types";
import { fetchTerms } from "../lib/api";

type AdmissionTermsProps = {
  value: string;
  onChange: (termId: string) => void;
};

export default function AdmissionTerms({ value, onChange }: AdmissionTermsProps) {
  const [terms, setTerms] = useState<admissionTerm[]>([]);

  const toTermText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const maybe = value as { term_name?: unknown; id?: unknown };
      if (typeof maybe.term_name === "string") return maybe.term_name;
      if (typeof maybe.id === "string") return maybe.id;
    }
    return "";
  };

  useEffect(() => {
    const fetch = async () => {
      const loadedTerms = await fetchTerms();
      setTerms(loadedTerms);
      if (!value && loadedTerms.length > 0) {
        onChange(loadedTerms[0].id);
      }
    };
    fetch();
  }, [onChange, value]);
  return (
    <div className="rounded-full bg-white px-4 py-1 text-[12px] font-bold text-[#2f76b7] shadow-sm border border-gray-200">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
        {terms.map((term) => (
            <option key={String(term.id)} value={String(term.id)}>
            {toTermText(term.term_name)}
            </option>
        ))}
        </select>
    </div>
  );
}