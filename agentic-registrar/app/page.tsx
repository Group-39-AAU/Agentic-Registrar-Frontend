function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      className="h-3 w-3 text-[#6a6a6a]"
      fill="currentColor"
    >
      <path d="M1.2 3.7a.9.9 0 0 1 1.3 0L5 6.2l2.5-2.5a.9.9 0 1 1 1.3 1.3L5.7 8a1 1 0 0 1-1.4 0L1.2 5a.9.9 0 0 1 0-1.3Z" />
    </svg>
  );
}

function AAULogoSmall() {
  return (
    <div className="flex items-center">
      <img
        src="/assets/logo.png"
        alt="Addis Ababa University"
        className="h-[40px] w-[40px] shrink-0"
      />

      <div className="h-[50px] w-[2px] shrink-0 bg-[#1f6fb3] ml-1 mr-2" />

      <div className="leading-none">
        <div className="text-[16px] tracking-wide text-[#1f6fb3] mb-1">
          አዲስ አበባ ዩኒቨርሲቲ
        </div>
        <div className="mt-2 text-[13px] font-bold tracking-wide text-[#e04b4b]">
          ADDIS ABABA UNIVERSITY
        </div>
      </div>
    </div>
  );
}

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
  return (
    <div className="min-h-screen bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a] min-w-screen">
      <header className="h-[70px] bg-white border-b border-gray-200 py-10">
        <div className="mx-auto flex h-full w-full max-w-[1180px] items-between px-5">
          <AAULogoSmall />

          <nav className="ml-auto flex items-center gap-0">
            <a
              className="flex items-center gap-0 px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
              href="/Web/Guest"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 576 512"
                className="h-4 w-4 text-[#384457]"
                fill="currentColor"
              >
                <path d="M280.37 148.26L96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0zM571.6 251.47L488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93z" />
              </svg>
              <span className="ml-2">Home</span>
            </a>
            <a
              href="#"
              className="px-3 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              Announcement
            </a>
            <a
              href="#"
              className="flex items-center gap-1 px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              <span>Admission</span>
              <ChevronDown />
            </a>
            <a
              href="#"
              className="flex items-center gap-1 px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              <span>Exams</span>
              <ChevronDown />
            </a>
            <a
              href="#"
              className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              Freshman
            </a>
            <a
              href="#"
              className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              Programs
            </a>
            <a
              href="#"
              className="px-2 py-2 text-base font-normal text-[#384457] hover:text-[#2f76b7]"
            >
              Calendar
            </a>
          </nav>
        </div>
      </header>

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
                  <form className="mt-4 flex flex-col gap-6">
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
                    type="button"
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
