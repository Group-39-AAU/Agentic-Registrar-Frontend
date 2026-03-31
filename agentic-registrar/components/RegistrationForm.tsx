"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormSelect } from "./AdmissionFormFields";

export default function RegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    fatherName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registering:", formData);
    router.push("/admissions/apply");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {/* Left Column */}
        <div className="flex flex-col gap-5">
          <FormInput
            label="First Name"
            name="firstName"
            required
            onChange={handleChange}
          />
          <FormInput
            label="Father Name"
            name="fatherName"
            required
            onChange={handleChange}
          />
          <FormInput
            label="Username (Functional Email)"
            name="email"
            type="email"
            required
            onChange={handleChange}
          />
          <FormInput
            label="Telephone"
            name="phone"
            type="tel"
            required
            onChange={handleChange}
          />
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-5">
          <FormInput
            label="Create a Password"
            name="password"
            type="password"
            required
            onChange={handleChange}
          />
          <FormInput
            label="Confirm your password"
            name="confirmPassword"
            type="password"
            required
            onChange={handleChange}
          />

          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              type="submit"
              className="h-[40px] w-full max-w-[200px] rounded-[4px] bg-[#3f79b5] text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#356e9f] uppercase tracking-wide"
            >
              CREATE ACCOUNT
            </button>
            <a
              href="/"
              className="text-[12px] text-[#5a5a5a] underline hover:text-[#2f76b7]"
            >
              Already have an applicant account?
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}
