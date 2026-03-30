import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-medium text-[#4a4a4a]">{label}</label>
      <input
        {...props}
        placeholder=""
        className={`h-[36px] rounded-md border ${
          error ? "border-red-500" : "border-gray-200"
        } bg-white px-3 text-[13px] text-[#2a2a2a] outline-none shadow-sm transition-all focus:border-[#2f76b7] focus:ring-1 focus:ring-[#2f76b7]/20`}
      />
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export function FormSelect({ label, options, error, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-[#3a3a3a]">{label}</label>
      <select
        {...props}
        className={`h-[38px] rounded-md border ${
          error ? "border-red-500" : "border-[#9bb0cc]"
        } bg-[#f8fafc] px-3 text-[13px] text-[#2a2a2a] outline-none focus:border-[#2f76b7] focus:ring-1 focus:ring-[#2f76b7]/40`}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}
