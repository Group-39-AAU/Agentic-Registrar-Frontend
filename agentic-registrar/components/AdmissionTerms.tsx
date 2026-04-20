"use client";

import { useEffect, useState } from "react";
import { admissionTerm } from "../lib/types";
import { fetchTerms } from "../lib/api";

export default function AdmissionTerms() {
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
      const terms = await fetchTerms();
      setTerms(terms);
    };
    fetch();
  }, []);
  return (
    <div className="rounded-full bg-white px-4 py-1 text-[12px] font-bold text-[#2f76b7] shadow-sm border border-gray-200">
        <select>
        {terms.map((term) => (
            <option key={String(term.id)} value={toTermText(term.term_name)}>
            {toTermText(term.term_name)}
            </option>
        ))}
        </select>
    </div>
  );
}