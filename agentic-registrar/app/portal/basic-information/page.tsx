"use client";

import { useEffect, useState } from "react";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";
import { fetchStudentMe, type StudentMeResponse } from "@/lib/api";

const ROMAN_YEAR = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function semesterToYear(currentSemester: number): string {
  if (!currentSemester || currentSemester < 1) return "";
  const year = Math.ceil(currentSemester / 2);
  return ROMAN_YEAR[year - 1] ?? String(year);
}

// TopStrip moved to shared component PortalTopStrip.

export default function BasicInformationPage() {
  const [profile, setProfile] = useState<StudentMeResponse | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchStudentMe()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setEmail(data.email ?? "");
      })
      .catch(() => {
        // Keep placeholder values if the request fails.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const yearLabel = profile ? semesterToYear(profile.current_semester) : "";

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1">
        <div className="flex flex-col gap-5 md:flex-row">
          <div className="pt-[8px]"><PortalSideMenu /></div>

          <section className="flex-1 md:ml-[115px]">
            <div className="md:max-w-[1024px] bg-white px-4 py-2 text-[16px] md:px-6">
              <h1 className="text-[22px] font-bold text-[#1f1f1f] md:text-[24px]">Basic Information</h1>
              <div className="color-[#000000] mb-6 md:mb-10" style={{height: "3px", width:"100%"}}></div>
              <div className="flex flex-col items-start justify-start gap-10 md:flex-row md:gap-[150px]">
                <div className="w-full md:max-w-[433px] flex-1">
                  <div className="grid grid-cols-[170px_1fr] items-center gap-x-8 gap-y-5 text-[16px]">
                    <span className="font-semibold">Full Name</span>
                    <span>{profile?.full_name ?? "—"}</span>

                    <span className="font-semibold">ID No.</span>
                    <span>{profile?.student_id ?? "—"}</span>
                  </div>

                  <div className="mt-7 space-y-5">
                    <div>
                      <label htmlFor="nationality" className="mb-2 block text-[16px] font-semibold">
                        Nationality
                      </label>
                      <input
                        id="nationality"
                        defaultValue="Ethiopia"
                        className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-5 text-[16px] outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="telephone" className="mb-2 block text-[16px] font-semibold">
                        Telephone
                      </label>
                      <input
                        id="telephone"
                        defaultValue="0969827560"
                        className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-5 text-[16px] outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="mb-2 block text-[16px] font-semibold">
                        Email
                      </label>
                      <input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-5 text-[16px] outline-none"
                      />
                    </div>

                    <div>
                      <p className="mb-2 block text-[16px] font-semibold">Date Of Birth (GC)</p>
                      <div className="grid grid-cols-3 gap-8">
                        <div>
                          <p className="mb-2 text-[16px] font-normal">Year</p>
                        <select className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-1 text-[16px] outline-none">
                          <option>2003</option>
                        </select>
                        </div>
                        <div>
                        <p className="mb-2 text-[16px] font-normal">Month</p>
                        <select className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-1 text-[16px] outline-none">
                          <option>Jan</option>
                        </select>
                        </div>
                       
                        <div>
                        <p className="mb-2 text-[16px] font-normal">Day</p>
                        <select className="h-[34px] w-full rounded border border-[#d0d5d8] px-3 py-1 text-[16px] outline-none">
                          <option>15</option>
                        </select>
                        </div>
                       
                      </div>
                      <div className="w-full">
                        <div className="mx-auto w-full">
                      <div className="mt-5 flex justify-center">
                        <button className="rounded bg-[#2b77b6] px-4 py-1 text-[16px] text-white">Submit</button>
                      </div>

                        </div>

                        <div className="mt-6 inline-block bg-[#f4d7db] text-[18px] font-bold text-[#a33135]">
                          Please <span className="text-[#1f73c9]">Click Here &gt;&gt;</span> To Complete Your Profile
                        </div>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="w-full text-[16px] flex-1 md:w-[300px]">
                  <div className="grid grid-cols-[110px_1fr] items-start gap-x-4 gap-y-4 md:pl-10">
                    <span className="font-semibold">Department</span>
                    <span>{profile?.department ?? "—"}</span>

                    <span className="font-semibold">Year</span>
                    <span>{yearLabel ? `Year ${yearLabel}` : "—"}</span>
                  </div>

                  <p className="mb-2 mt-6 text-[16px] font-semibold">Photo Preview</p>
                  <img
                    src="https://portal.aau.edu.et/Images/DefaultPhoto.png"
                    alt="Profile Preview"
                    className="h-[210px] w-[205px] bg-[#2f69a0] object-cover"
                  />
                  <p className="mt-3 text-[16px] italic text-[#2f2f2f]">
                    Allowed image Formats
                    <br />
                    (.JPEG,.PNG,GIF,.JPG) (Passport size)
                  </p>
                  <input
                    type="file"
                    className="mt-3 block w-full max-w-[205px] text-[16px] text-[#2f2f2f] file:mr-2 file:rounded file:border file:border-[#9aa7b3] file:bg-[#f4f4f4] file:px-2 file:py-[1px]"
                  />
                </div>
              </div>

             
            </div>
          </section>
        </div>
      </main>

      <PortalFooter />
    </div>
  );
}
