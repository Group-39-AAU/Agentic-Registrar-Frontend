"use client";

import Header from "./components/header";
import { useRouter } from "next/navigation";
import React from "react";


function PortalTile({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description: string;
  variant: "exams" | "admission" | "alumni";
  imageUrl: string;
}) {
  
  return (
    <div className="h-[128px] w-full overflow-hidden rounded-md bg-[#2f76b7] shadow-sm">
      <div className="flex h-full w-full">
        <div className="flex-1 overflow-hidden rounded-r-[40%] rounded-l-none">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full rounded-r-[40%] rounded-l-none object-cover"
          />
        </div>
        <div className="flex-2 px-5 py-5">
          <div className="text-[15px] font-semibold text-white leading-tight">
            <h3 className="text-[14px] font-semibold text-white leading-tight">{title}</h3>
          </div>
          <div className="h-[3px]"></div>
          <div className="mt-1 text-[12px] leading-loose text-white/90 ">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingGraphic() {
  // Line-art style approximation of the portal building graphic.
  return (
    <div className="w-full bg-white px-4">
      <img
        src="/assets/login.png"
        alt="Building Graphic"
        className="block w-full object-cover"
      />
      {/* Thick blue divider bar under the header image */}
    </div>
  );
}

function InputWithIcon({
  icon,
  placeholder,
  type = "text",
  defaultValue,
}: {
  icon: React.ReactNode;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
        {icon}
      </div>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-md border border-[#9bb0cc] bg-[#eef4ff] py-2 pl-10 pr-3 text-[12px] text-[#2a2a2a] outline-none focus:border-[#2f76b7] focus:ring-1 focus:ring-[#2f76b7]/40"
      />
    </div>
  );
}

function AAUEmblem() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="h-[54px] w-[54px] rounded-full border-[2px] border-white/80 grid place-items-center">
        <img 
          src="/assets/logo.png"
          alt="AAU Emblem"
          className="h-[46px] w-[46px]"
        />
      </div>
      <div className="text-[12px] leading-tight text-white/90">
        <div className="font-semibold">ADDIS ABABA UNIVERSITY</div>
        <div className="text-[10px] text-white/70">All rights reserved.</div>
      </div>
    </div>
  );
}

function HelpButton() {
  return (
    <button
      type="button"
      aria-label="Help"
      className="fixed bottom-5 right-5 z-50 h-[42px] w-[42px] rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] grid place-items-center"
    >
          <img src="https://www.shutterstock.com/image-vector/headphones-logo-can-be-used-600nw-1612779220.jpg" alt="Floating Image" className="w-10 h-10 rounded-full box-shadow-lg" />

    </button>
  );
}

export default function Home() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/admissions/my-admissions");
  };

  return (
    <div className="min-h-screen bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a] min-w-screen">
     <Header/>

      <main className="mx-auto w-full max-w-[1150px] px-5 pb-0 pt-7 mt-2">
        <div className="flex gap-30 items-center">
          <div className="w-[558px]">
            <div className="flex flex-col gap-5">
              <PortalTile
                variant="exams"
                title="Online Exams"
                description="Prospective applicants and professionals can apply for exams offered at Addis Ababa University"
                imageUrl="/assets/exam.jpg"
              />
              <PortalTile
                variant="admission"
                title="Apply for Admission"
                description="New applicants who aspire to join Addis Ababa University can apply"
                imageUrl="/assets/Admission.jpg"
              />
              <PortalTile
                variant="alumni"
                title="Alumni Services"
                description="You can submit alumni service requests to Addis Ababa University."
                imageUrl="/assets/Alumni%20.jpg"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="max-w-[325px]">
              <div className="overflow-hidden bg-white">
                <BuildingGraphic />
                <div className="h-[6px] w-full bg-[#3f79b5]" />

                <div className="px-10 pb-2 pt-8 shadow-[0_12px_28px_rgba(0,0,0,0.12)] border border-black/10 pb-6">
                  <div className="text-[18px] text-[#2a66a7]">
                    Login to your account
                  </div>
                  <form onSubmit={handleLogin} className="mt-4 flex flex-col gap-6">
                  <InputWithIcon
                    icon={
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-[#6b6b6b]"
                      >
                        <path
                          d="M20 21a8 8 0 0 0-16 0"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle
                          cx="12"
                          cy="8"
                          r="4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    }
                    placeholder="UGR/1504/14"
                    defaultValue=""
                  />
                  <InputWithIcon
                    icon={
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4 text-[#6b6b6b]"
                      >
                        <path
                          d="M7 11V8a5 5 0 0 1 10 0v3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <rect
                          x="6"
                          y="11"
                          width="12"
                          height="10"
                          rx="2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    }
                    type="password"
                    placeholder="..."
                    defaultValue=""
                  />
                  <button
                    type="submit"
                    className="h-[40px] rounded bg-[#3f79b5] text-[18px] text-white hover:bg-[#356e9f]"
                  >
                    Login
                  </button>

                  <a
                    href="#"
                    className="text-[18px] text-[#808080] hover:underline"
                  >
                    Forgot Password?
                  </a>
                </form>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-10 bg-[#3f79b5]">
        <div className="mx-auto w-full max-w-[1024px] px-5 py-12">
          <div className="flex items-start justify-between gap-8">
            <AAUEmblem />

            <div className="w-[320px] flex flex-col text-white items-center justify-center">
              <div className="text-[16px] font-semibold">Quick Links</div>
              <div className="mt-2 text-[12px] font-semibold">E-Learning</div>
              <a href="#" className="mt-1 block text-[12px] text-white/90">
                Website
              </a>
            </div>

            <div className="w-[220px] flex flex-col text-white items-center justify-center">
              <div className="text-[16px] font-semibold">Social Media</div>
              <div className="mt-2 flex flex-col gap-1 text-[12px] text-white/90 items-center justify-center">
                <a href="#" className="hover:text-white">
                  Facebook
                </a>
                <a href="#" className="hover:text-white">
                  Twitter
                </a>
                <a href="#" className="hover:text-white">
                  Youtube
                </a>
                <a href="#" className="hover:text-white">
                  Telegram
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-[10px] text-white/70">
            © 2026 - Addis Ababa University. All Rights Reserved.
          </div>
        </div>
      </footer>

      <HelpButton />
    </div>
  );
}
