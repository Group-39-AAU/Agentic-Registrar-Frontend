"use client";

import { useEffect } from "react";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";

function TopStrip() {
  return (
    <div className="border-b border-[#b8c7d5] bg-[linear-gradient(90deg,#eef4f8_0%,#d8e8f5_100%)] py-1">
      <div className="mx-[70px] flex h-[96px] max-w-[1200px] items-center px-6">
        <a href="http://localhost:3000/portal/home">
          <img src="/assets/logo.png" alt="AAU" className="h-[100px] w-[100px]" />
        </a>
        <div className="ml-4">
          <p className="text-[25px] leading-none text-[#cf2e2e]">ADDIS ABABA UNIVERSITY</p>
          <p className="mt-1 ml-12 text-[20px] font-bold leading-none text-[#cf2e2e]">አዲስ አበባ ዩኒቨርሲቲ</p>
          <p className="mt-1 ml-32 text-[16px] text-[#4a5a6a]">
            Seek wisdom, Elevate Your Intellect and Serve Humanity
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BasicInformationPage() {
  useEffect(() => {
    document.title = "Basic Information | Addis Ababa University";
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <TopStrip />
      <PortalMainNav />

      <main className="flex-1">
        <div className="flex gap-5">
          <div className="pt-[8px]"><PortalSideMenu /></div>

          <section className="ml-[115px] flex-1">
            <div className="max-w-[1024px] bg-white px-6 py-2 text-[16px]">
              <h1 className="text-[24px] font-bold text-[#1f1f1f]">Basic Information</h1>
              <div className="color-[#000000] mb-10" style={{height: "3px", width:"100%"}}></div>
              <div className="flex items-start justify-start gap-[150px]">
                <div className="w-full max-w-[433px] flex-1">
                  <div className="grid grid-cols-[170px_1fr] items-center gap-x-8 gap-y-5 text-[16px]">
                    <span className="font-semibold">Full Name</span>
                    <span>EPHREM MAMO TORA</span>

                    <span className="font-semibold">ID No.</span>
                    <span>UGR/1504/14</span>
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
                        defaultValue="ephremmamo55@gmail.com"
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

                <div className="w-[300px] text-[16px] flex-1">
                  <div className="grid grid-cols-[110px_1fr] items-start gap-x-4 gap-y-4 pl-10">
                    <span className="font-semibold">Department</span>
                    <span>School of information technology and Engineering 2024</span>

                    <span className="font-semibold">Year</span>
                    <span>Year V</span>
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
