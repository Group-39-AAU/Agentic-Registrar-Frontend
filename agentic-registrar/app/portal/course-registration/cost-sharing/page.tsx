"use client";

import { useState } from "react";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";

type TabType = "instructions" | "cost-sharing";

export default function CostSharingPage() {
  const [activeTab, setActiveTab] = useState<TabType>("cost-sharing");

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff] font-[Arial,Helvetica,sans-serif] text-[16px] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px] md:pr-[130px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 md:ml-[140px]">
            <div className="px-3 py-1 text-[16px] md:px-2">
              <div className="md:max-w-[995px]">
                <div className="grid grid-cols-[120px_1fr] gap-y-2 px-1 md:grid-cols-[180px_360px_160px_1fr] md:px-4">
                  <p className="font-semibold">Full Name</p>
                  <p>EPHREM MAMO TORA</p>
                  <p className="font-semibold">Year</p>
                  <p>Year V</p>

                  <p className="font-semibold">ID No.</p>
                  <p>UGR/1504/14</p>
                  <p className="font-semibold">Admission Type</p>
                  <p>Regular</p>

                  <p className="self-center font-semibold">Program</p>
                  <p className="md:w-[324px]">Bachelor of Science in Software Engineering and Computing Technology (Software Engineering Stream)</p>
                  <p className="font-semibold">Semester</p>
                  <p>One</p>
                </div>

                <p className="mt-6 px-4 text-[13px] font-semibold italic text-[#bf2c2c]">
                  Note that boarding service is In Cash for students who come from addis ababa city administration !
                </p>

                <div className="mt-3 px-4">
                  <div className="flex border-b border-[#d9d9d9] text-[16px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("instructions")}
                      className={`cursor-pointer border border-b-0 border-[#d9d9d9] px-4 py-2 ${
                        activeTab === "instructions" ? "bg-white text-[#2f78b7]" : "bg-[#f3f3f3] text-[#555]"
                      }`}
                    >
                      Instructions
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("cost-sharing")}
                      className={`cursor-pointer border border-b-0 border-l-0 border-[#d9d9d9] px-4 py-2 ${
                        activeTab === "cost-sharing" ? "bg-white text-[#2f78b7]" : "bg-[#f3f3f3] text-[#555]"
                      }`}
                    >
                      Cost Sharing Form
                    </button>
                  </div>

                  {activeTab === "instructions" ? (
                    <div className="min-h-[300px] border-t-0  bg-white px-4 py-4 text-[16px]">
                      <h2 className="mb-3 text-[24px] font-semibold text-[#1f1f1f]">To fill and submit Cost Sharing:</h2>
                      <ol className="list-decimal pl-8 text-[16px] leading-[1.6]">
                        <li>Fill all the spaces with valid information.</li>
                        <li>Click Submit button, to save the filled information.</li>
                        <li>Once submitted, you cannot modify, so fill it carefully.</li>
                      </ol>
                    </div>
                  ) : (
                    <div className="min-h-[300px] border-t-0 bg-white px-4 py-4">
                      <ul className="mb-4 list-disc pl-6 text-[16px]">
                        <li>The Telephone field is required.</li>
                      </ul>

                      <div className="grid max-w-[760px] grid-cols-1 gap-x-4 gap-y-3 text-[16px] md:grid-cols-2">
                        <div>
                          <p className="mb-1">Academic Year</p>
                          <select className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-white px-2 text-[16px]">
                            <option>2025/2026</option>
                            <option>2024/2025</option>
                            <option>2023/2024</option>
                            <option>2022/2023</option>
                          </select>
                        </div>
                        <div>
                          <p className="mb-1">In Kind Service</p>
                          <select className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-white px-2 text-[16px]">
                            <option>None</option>
                            <option>Food Only</option>
                            <option>Boaring only</option>
                            <option>Food and Boarding</option>
                          </select>
                        </div>

                        <div>
                          <p className="mb-1">15% Tuition Fee (in Birr)</p>
                          <input value="1382.11" readOnly className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-[#f3f3f3] px-2 text-[16px]" />
                        </div>
                        <div>
                          <p className="mb-1">In Cash Service</p>
                          <select className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-white px-2 text-[16px]">
                            <option>None</option>
                            <option>Food Only</option>
                            <option>Boaring only</option>
                            <option>Food and Boarding</option>
                          </select>
                        </div>

                        <div>
                          <p className="mb-1">Food Expense (in Birr)</p>
                          <input value="30000.00" readOnly className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-[#f3f3f3] px-2 text-[16px]" />
                        </div>
                        <div>
                          <p className="mb-1">Payment Type</p>
                          <select className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-white px-2 text-[16px]">
                            <option>To be paid from my income</option>
                            <option>To Provide Service not morethan the training period in my profession</option>
                            <option>None</option>
                          </select>
                        </div>

                        <div>
                          <p className="mb-1">Boarding Expense (in Birr)</p>
                          <input value="600.00" readOnly className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-[#f3f3f3] px-2 text-[16px]" />
                        </div>
                        <div>
                          <p className="mb-1">Bank Account No.</p>
                          <input value="1000356102839" readOnly className="h-[34px] w-full max-w-[300px] border border-[#d9d9d9] bg-white px-2 text-[16px]" />
                        </div>
                      </div>
                    </div>
                  )}
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
