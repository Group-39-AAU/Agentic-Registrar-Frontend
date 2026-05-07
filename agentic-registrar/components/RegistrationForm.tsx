"use client";

import React, { useState } from "react";
import { ApiError, registerUser } from "@/lib/api";
import { truncatePasswordTo72Bytes } from "@/lib/password";
import { FormInput } from "./AdmissionFormFields";
import Link from "next/link";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    fatherName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const password = truncatePasswordTo72Bytes(formData.password);
    const confirm = truncatePasswordTo72Bytes(formData.confirmPassword);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email: formData.email.trim(),
        password,
        first_name: formData.firstName.trim(),
        last_name: formData.fatherName.trim(),
      });
      setSuccess(true);
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="w-full">
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-[12px] text-green-800">
          Registration successful.{" "}
          <Link
            href="/admissions/login"
            className="font-semibold text-[#2f76b7] underline"
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <FormInput
            label="First Name"
            name="firstName"
            value={formData.firstName}
            required
            onChange={handleChange}
          />
          <FormInput
            label="Last Name"
            name="fatherName"
            value={formData.fatherName}
            required
            onChange={handleChange}
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            required
            onChange={handleChange}
          />
          <FormInput
            label="Telephone (optional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-5">
          <FormInput
            label="Create a Password"
            name="password"
            type="password"
            value={formData.password}
            required
            onChange={handleChange}
            autoComplete="new-password"
          />
          <FormInput
            label="Confirm your password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            required
            onChange={handleChange}
            autoComplete="new-password"
          />

          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="h-[40px] w-full max-w-[200px] rounded-[4px] bg-[#3f79b5] text-[13px] font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-[#356e9f] disabled:opacity-60"
            >
              {loading ? "Creating…" : "CREATE ACCOUNT"}
            </button>
            <Link
              href="/admissions/login"
              className="text-[12px] text-[#5a5a5a] underline hover:text-[#2f76b7]"
            >
              Already have an applicant account?
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
