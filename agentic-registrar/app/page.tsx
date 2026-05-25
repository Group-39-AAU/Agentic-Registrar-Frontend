import Link from "next/link";
import Header from "./components/header";
import PortalLoginForm from "../components/PortalLoginForm";

function BuildingGraphic() {
  return (
    <div className="w-full bg-white px-4">
      <img
        src="/assets/login.png"
        alt="Building Graphic"
        className="block w-full object-cover"
      />
    </div>
  );
}


function PortalTile({
  title,
  description,
  imageUrl,
  href,
}: {
  title: string;
  description: string;
  variant: "exams" | "admission" | "alumni";
  imageUrl: string;
  href?: string;
}) {
  const card = (
    <div className="group h-[128px] w-full cursor-pointer overflow-hidden rounded-md bg-[linear-gradient(135deg,#3a86c4_0%,#2f76b7_55%,#28649b_100%)] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_28px_-16px_rgba(31,91,148,0.5)] transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_22px_36px_-18px_rgba(31,91,148,0.7)]">
      <div className="flex h-full w-full">
        <div className="flex-1 overflow-hidden rounded-r-[40%] rounded-l-none">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full rounded-r-[40%] rounded-l-none object-cover transition-transform duration-500 group-hover:scale-[1.06]"
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

  if (!href) return card;
  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3f79b5] rounded-md">
      {card}
    </Link>
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
     <Header/>

      <main className="mx-auto w-full max-w-[1150px] px-5 pb-0 pt-7 mt-2">
        <div className="flex flex-col items-stretch gap-10 md:flex-row md:items-center md:gap-30">
          <div className="w-full md:w-[558px]">
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
                href="/admissions"
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
            <div className="mx-auto max-w-[325px]">
              <div className="overflow-hidden rounded-md bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_20px_40px_-22px_rgba(31,91,148,0.45)] ring-1 ring-black/[0.04] transition-shadow duration-300 hover:shadow-[0_2px_6px_rgba(15,23,42,0.08),0_28px_50px_-22px_rgba(31,91,148,0.55)]">
                <BuildingGraphic />
                <div className="h-[6px] w-full bg-[linear-gradient(90deg,#3a86c4_0%,#3f79b5_50%,#28649b_100%)]" />
                <PortalLoginForm />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-10 bg-[#3f79b5]">
        <div className="mx-auto w-full max-w-[1024px] px-5 py-8 md:py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
            <AAUEmblem />

            <div className="w-full md:w-[320px] flex flex-col text-white items-center justify-center">
              <div className="text-[16px] font-semibold">Quick Links</div>
              <div className="mt-2 text-[12px] font-semibold">E-Learning</div>
              <a href="#" className="mt-1 block text-[12px] text-white/90">
                Website
              </a>
            </div>

            <div className="w-full md:w-[220px] flex flex-col text-white items-center justify-center">
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
