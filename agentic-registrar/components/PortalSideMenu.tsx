"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredStudentAccessToken } from "@/lib/api";
import { getFeatureHref } from "@/components/PortalMainNav";

export default function PortalSideMenu() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    clearStoredStudentAccessToken();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("aau-auth-changed"));
    }
    setMobileOpen(false);
    router.replace("/");
  }

  function handleQuickClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    name: string,
  ) {
    if (name === "Logout") {
      event.preventDefault();
      handleLogout();
      return;
    }
    if (getFeatureHref(name) === "#") {
      event.preventDefault();
    } else {
      setMobileOpen(false);
    }
  }
  const nav = [
    {
      name: "Registration",
      image: (
        <svg className="svg-inline--fa fa-edit fa-w-18" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="edit" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>
      ),
    },
    {
      name: "Grade & Results",
      image: (
        <svg className="svg-inline--fa fa-print fa-w-16" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="print" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M448 192V77.25c0-8.49-3.37-16.62-9.37-22.63L393.37 9.37c-6-6-14.14-9.37-22.63-9.37H96C78.33 0 64 14.33 64 32v160c-35.35 0-64 28.65-64 64v112c0 8.84 7.16 16 16 16h48v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h48c8.84 0 16-7.16 16-16V256c0-35.35-28.65-64-64-64zm-64 256H128v-96h256v96zm0-224H128V64h192v48c0 8.84 7.16 16 16 16h48v96zm48 72c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z"></path></svg>
      ),
    },
    {
      name: "Registration Slip",
      image: (
        <svg className="svg-inline--fa fa-print fa-w-16" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="print" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M448 192V77.25c0-8.49-3.37-16.62-9.37-22.63L393.37 9.37c-6-6-14.14-9.37-22.63-9.37H96C78.33 0 64 14.33 64 32v160c-35.35 0-64 28.65-64 64v112c0 8.84 7.16 16 16 16h48v96c0 17.67 14.33 32 32 32h320c17.67 0 32-14.33 32-32v-96h48c8.84 0 16-7.16 16-16V256c0-35.35-28.65-64-64-64zm-64 256H128v-96h256v96zm0-224H128V64h192v48c0 8.84 7.16 16 16 16h48v96zm48 72c-13.25 0-24-10.75-24-24 0-13.26 10.75-24 24-24s24 10.74 24 24c0 13.25-10.75 24-24 24z"></path></svg>
      ),
    },
    {
      name: "Catering Information",
      image: (
        <svg className="svg-inline--fa fa-folder-open fa-w-18" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="folder-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"></path></svg>
      ),
    },
    {
      name: "Cocurricular Activities",
      image: (
        <svg className="svg-inline--fa fa-folder-open fa-w-18" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="folder-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"></path></svg>
      ),
    },
    {
      name: "Staff Evaluation",
      image: (
        <svg className="svg-inline--fa fa-folder-open fa-w-18" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="folder-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M572.694 292.093L500.27 416.248A63.997 63.997 0 0 1 444.989 448H45.025c-18.523 0-30.064-20.093-20.731-36.093l72.424-124.155A64 64 0 0 1 152 256h399.964c18.523 0 30.064 20.093 20.73 36.093zM152 224h328v-48c0-26.51-21.49-48-48-48H272l-64-64H48C21.49 64 0 85.49 0 112v278.046l69.077-118.418C86.214 242.25 117.989 224 152 224z"></path></svg>
      ),
    },
  ];
  const quick = [{"name": "Basic Information", "image": <svg className="svg-inline--fa fa-envelope fa-w-16" style={{ color: "#3b7bbc", width: "14px", height: "14px" }} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="envelope" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path></svg>},
    {"name": "My Schedule", "image": <svg className="svg-inline--fa fa-briefcase fa-w-16" style={{color: "#3b7bbc", width: "14px", height:"14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="briefcase" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M320 336c0 8.84-7.16 16-16 16h-96c-8.84 0-16-7.16-16-16v-48H0v144c0 25.6 22.4 48 48 48h416c25.6 0 48-22.4 48-48V288H320v48zm144-208h-80V80c0-25.6-22.4-48-48-48H176c-25.6 0-48 22.4-48 48v48H48c-25.6 0-48 22.4-48 48v80h512v-80c0-25.6-22.4-48-48-48zm-144 0H192V96h128v32z"></path></svg>},
    {"name": "My Profile", "image": <svg className="svg-inline--fa fa-briefcase fa-w-16" style={{color: "#3b7bbc", width: "14px", height:"14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="briefcase" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M320 336c0 8.84-7.16 16-16 16h-96c-8.84 0-16-7.16-16-16v-48H0v144c0 25.6 22.4 48 48 48h416c25.6 0 48-22.4 48-48V288H320v48zm144-208h-80V80c0-25.6-22.4-48-48-48H176c-25.6 0-48 22.4-48 48v48H48c-25.6 0-48 22.4-48 48v80h512v-80c0-25.6-22.4-48-48-48zm-144 0H192V96h128v32z"></path></svg>},
    {"name": "Bank Account", "image": <svg className="svg-inline--fa fa-eye-slash fa-w-20" style={{color: "#3b7bbc", width: "14px", height:"14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="eye-slash" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" data-fa-i2svg=""><path fill="currentColor" d="M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z"></path></svg>},
    {"name": "Change Password", "image": <svg className="svg-inline--fa fa-lock fa-w-14" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="lock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path></svg>},
    {"name": "User Guide", "image": <svg className="svg-inline--fa fa-download fa-w-16" style={{color: "#3b7bbc", width: "14px", height: "14px"}} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="download" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M216 0h80c13.3 0 24 10.7 24 24v168h87.7c17.8 0 26.7 21.5 14.1 34.1L269.7 378.3c-7.5 7.5-19.8 7.5-27.3 0L90.1 226.1c-12.6-12.6-3.7-34.1 14.1-34.1H192V24c0-13.3 10.7-24 24-24zm296 376v112c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V376c0-13.3 10.7-24 24-24h146.7l49 49c20.1 20.1 52.5 20.1 72.6 0l49-49H488c13.3 0 24 10.7 24 24zm-124 88c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20zm64 0c0-11-9-20-20-20s-20 9-20 20 9 20 20 20 20-9 20-20z"></path></svg>},
    {"name": "Logout", "image": <svg className="svg-inline--fa fa-sign-out-alt fa-w-16" style={{ color: "#3b7bbc", width: "14px", height: "14px" }} aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sign-out-alt" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M497 273L329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-96c0-13.3 10.7-24 24-24h136V88c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96c-53 0-96 43-96 96v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12z"></path></svg>}];

  const menuBody = (
    <>
      <div className="rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#4b91cf] px-3 py-2 text-[14px] font-semibold tracking-wide text-white shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]">
        Navigation
      </div>
      <div className="overflow-hidden rounded-b-sm border border-[#c6d3de] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(31,91,148,0.18)]">
        {nav.map((item, idx) => (
          <div
            key={item.name}
            className={`group border-b border-[#DFF0D8] px-[15px] py-[8px] text-[14px] flex items-center gap-2 transition-colors duration-150 hover:bg-[#dbe9f4]/60 ${idx % 2 ? "bg-[#e9f2e3]" : "bg-white"}`}
          >
            {item.image}
            <a
              href={getFeatureHref(item.name)}
              onClick={(event) => {
                if (getFeatureHref(item.name) === "#") event.preventDefault();
                else setMobileOpen(false);
              }}
              className="cursor-pointer no-underline hover:no-underline"
              style={{ fontWeight: 400 }}
            >
              {item.name}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#4b91cf] px-3 py-2 text-[14px] text-white">
        Quick Links
      </div>
      <div className="overflow-hidden rounded-b-sm border border-[#c6d3de] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(31,91,148,0.18)]">
        {quick.map((item, idx) => (
          <div
            key={item["name"]}
            className={`group border-b border-[#DFF0D8] px-[15px] py-[8px] text-[14px] flex items-center gap-2 transition-colors duration-150 hover:bg-[#dbe9f4]/60 ${idx % 2 ? "bg-[#e9f2e3]" : "bg-white"}`}
          >
            {item["image"]}
            <a
              href={getFeatureHref(item["name"])}
              onClick={(event) => handleQuickClick(event, item["name"])}
              className="cursor-pointer no-underline hover:no-underline"
              style={{ fontWeight: 400 }}
            >
              {item["name"]}
            </a>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <>
      <div className="md:hidden mb-2 mx-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 rounded border border-[#c6d3de] bg-white px-3 py-2 text-[14px] font-semibold text-[#1f1f1f] shadow-sm"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
          Navigation
        </button>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div
        className={`fixed left-0 top-0 z-50 h-full w-[280px] max-w-[85vw] transform overflow-y-auto bg-[#f5f8fb] p-3 shadow-xl transition-transform duration-300 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[15px] font-semibold text-[#1f1f1f]">Navigation</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="grid h-9 w-9 place-items-center rounded text-[#1f1f1f] hover:bg-black/5"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>
        {menuBody}
      </div>

      <aside className="hidden md:block w-[255px] mx-[15px]">
      <div className="rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#4b91cf] px-3 py-2 text-[14px] font-semibold tracking-wide text-white shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)]">
        Navigation
      </div>
      <div className="overflow-hidden rounded-b-sm border border-[#c6d3de] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(31,91,148,0.18)]">
        {nav.map((item, idx) => (
          <div
            key={item.name}
            className={`group border-b border-[#DFF0D8] px-[15px] py-[8px] text-[14px] flex items-center gap-2 transition-colors duration-150 hover:bg-[#dbe9f4]/60 ${idx % 2 ? "bg-[#e9f2e3]" : "bg-white"}`}
          >
            {item.image}
            <a
              href={getFeatureHref(item.name)}
              onClick={(event) => {
                if (getFeatureHref(item.name) === "#") event.preventDefault();
              }}
              className="cursor-pointer no-underline hover:no-underline"
              style={{ fontWeight: 400 }}
            >
              {item.name}
            </a>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#4b91cf] px-3 py-2 text-[14px] text-white">
        Quick Links
      </div>
      <div className="overflow-hidden rounded-b-sm border border-[#c6d3de] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(31,91,148,0.18)]">
        {quick.map((item, idx) => (
          <div
            key={item["name"]}
            className={`group border-b border-[#DFF0D8] px-[15px] py-[8px] text-[14px] flex items-center gap-2 transition-colors duration-150 hover:bg-[#dbe9f4]/60 ${idx % 2 ? "bg-[#e9f2e3]" : "bg-white"}`}
          >
            {item["image"]}
            <a
              href={getFeatureHref(item["name"])}
              onClick={(event) => handleQuickClick(event, item["name"])}
              className="cursor-pointer no-underline hover:no-underline"
              style={{ fontWeight: 400 }}
            >
              {item["name"]}
            </a>
          </div>
        ))}
      </div>
    </aside>
    </>
  );
}
