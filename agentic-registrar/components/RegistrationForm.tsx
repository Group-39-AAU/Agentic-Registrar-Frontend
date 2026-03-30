"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormInput, FormSelect } from "./AdmissionFormFields";

export default function RegistrationForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate registration
    console.log("Registering:", formData);
    // Redirect to admission application form
    router.push("/admissions/apply");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <FormInput
          label="First Name"
          name="firstName"
          placeholder="First Name"
          required
          onChange={handleChange}
        />
        <FormInput
          label="Middle Name"
          name="middleName"
          placeholder="Middle Name"
          required
          onChange={handleChange}
        />
        <FormInput
          label="Last Name"
          name="lastName"
          placeholder="Last Name"
          required
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormSelect
          label="Gender"
          name="gender"
          required
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
          onChange={handleChange}
        />
        <FormInput
          label="Date of Birth"
          name="dob"
          type="date"
          required
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Email (Username)"
          name="email"
          type="email"
          placeholder="example@email.com"
          required
          onChange={handleChange}
        />
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          placeholder="+251 ..."
          required
          onChange={handleChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          label="Password"
          name="password"
          type="password"
          required
          onChange={handleChange}
        />
        <FormInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          required
          onChange={handleChange}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <button
          type="submit"
          className="h-[44px] w-full rounded-md bg-[#3f79b5] text-[16px] font-semibold text-white shadow-md transition-colors hover:bg-[#356e9f]"
        >
          Create Account
        </button>
        <p className="text-center text-[13px] text-[#5a5a5a]">
          Already have an account?{" "}
          <a href="/" className="font-semibold text-[#2f76b7] hover:underline">
            Login here
          </a>
        </p>
      </div>
    </form>
  );
}
