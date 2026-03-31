import type { Metadata } from "next";
import Header from "../components/header";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Apply to undergraduate and graduate programs at Addis Ababa University.",
};

/** Matches existing home page LOGIN / logo accent */





function prng(x: number, y: number, seed: number) {
  const a = Math.imul(x + seed, 374761393);
  const b = Math.imul(y + seed, 668265263);
  let t = (a + b) >>> 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177) >>> 0;
  return t / 4294967295;
}

function FakeQrWithLogo({ size = 120 }: { size?: number }) {
  const modules = 29;
  const seed = 1337;

  const isInCornerFinder = (x: number, y: number) => {
    const inTopLeft = x < 7 && y < 7;
    const inTopRight = x >= modules - 7 && y < 7;
    const inBottomLeft = x < 7 && y >= modules - 7;
    return inTopLeft || inTopRight || inBottomLeft;
  };

  const isFinderBlack = (x: number, y: number) => {
    const corners: Array<[number, number]> = [
      [0, 0],
      [modules - 7, 0],
      [0, modules - 7],
    ];
    for (const [ox, oy] of corners) {
      if (x >= ox && x < ox + 7 && y >= oy && y < oy + 7) {
        const dx = x - ox;
        const dy = y - oy;
        const outerBorder = dx === 0 || dx === 6 || dy === 0 || dy === 6;
        const innerBlack = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return outerBorder || innerBlack;
      }
    }
    return false;
  };

  const logoInset = Math.round(modules * 0.32);
  const logoSize = modules - logoInset * 2;

  return (
    <div className="relative inline-block bg-white">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${modules} ${modules}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Official QR code"
      >
        <rect x="0" y="0" width={modules} height={modules} fill="#fff" />
        {Array.from({ length: modules }).flatMap((_, x) =>
          Array.from({ length: modules }).map((__, y) => {
            const inLogoHole =
              x >= logoInset &&
              x < logoInset + logoSize &&
              y >= logoInset &&
              y < logoInset + logoSize;
            if (inLogoHole) return null;

            const black = isInCornerFinder(x, y)
              ? isFinderBlack(x, y)
              : x === 8 || y === 8
                ? (x + y) % 2 === 0 && !(x < 8 && y < 8)
                : prng(x, y, seed) > 0.67;

            if (!black) return null;
            return (
              <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" />
            );
          })
        )}
      </svg>
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 grid h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center overflow-hidden rounded-full bg-white"
        style={{ boxShadow: "0 0 0 2px #fff" }}
      >
        <img
          src="/assets/logo.png"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}

type StudyCardProps = {
  title: string;
  headline: string;
  subtext: string;
  imageSrc: string;
  buttonText: string;
};

function StudyCard({
  title,
  headline,
  subtext,
  imageSrc,
  buttonText,
}: StudyCardProps) {
  const parts = subtext.split("HOW TO APPLY");
  const before = parts[0] ?? "";
  const after = parts.slice(1).join("HOW TO APPLY");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
      <img
        src={imageSrc}
        alt={title}
        className="h-[500px] w-full object-cover"
      />
      <div className="px-6 pb-7 pt-6">
        <div className="text-[30px] font-bold text-[#1a1a1a]">{title}</div>
        <div className="mt-2 text-[18px] font-semibold text-[#2f76b7]">
          {headline}
        </div>
        <div className="mt-3 text-[18px] text-[#3a3a3a]">
          {before}
          <span className="font-bold text-[#2f76b7]">HOW TO APPLY</span>
          {after}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/admissions/apply"
            className="h-[34px] w-full max-w-[320px] rounded-[3px] bg-[#3f79b5] text-[11px] font-semibold text-white shadow-[0_3px_0_rgba(0,0,0,0.03)] transition-colors hover:bg-[#356e9f]"
          >
            <button type="button" className="w-full h-full">{buttonText}</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChatHeadsetIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] text-white"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

function FloatingChat() {
  return (
    <button
      type="button"
      aria-label="Chat support"
      className="fixed bottom-6 right-5 z-50 grid h-10 w-10 place-items-center rounded-full bg-[#3f79b5] shadow-[0_8px_18px_rgba(63,121,181,0.45)] transition-colors hover:bg-[#356e9f]"
    >
      <ChatHeadsetIcon />
    </button>
  );
}

export default function AdmissionsPage() {
  return (
    <div className="min-h-screen bg-white font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <Header/>

      <main className="">
        <section className="relative h-[50rem]">
          <img
            src="https://admission.aau.edu.et/AAU/coursel-image-2.jpg"
            alt="Addis Ababa University archway"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative mx-auto flex h-full max-w-[1180px] items-center justify-center px-5 py-10">
            <h1 className="max-w-[920px] text-center text-[clamp(28px,5vw,44px)] font-semibold leading-tight text-white [font-family:Georgia,serif] drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)]">
              Study at Addis Ababa University
            </h1>
          </div>
        </section>

        <section className="mx-auto w-full px-5 pb-16 pt-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <StudyCard
              title="Undergraduate Study"
              headline="Find out what undergraduate programs we offer"
              subtext="Find out HOW TO APPLY for undergraduate programs"
              imageSrc="/assets/ug.jpg"
              buttonText="APPLY"
            />
            <StudyCard
              title="Graduate Study"
              headline="Find out what graduate programs we offer"
              subtext="Find out HOW TO APPLY for graduate programs"
              imageSrc="/assets/grad.jpeg"
              buttonText="APPLY"
            />
          </div>

          <div className="mt-12 flex flex-col items-center">
            <a
              href="#"
              className="mb-2 text-[11px] font-semibold text-black/70 underline underline-offset-2"
            >
              AAU-Official
            </a>
            <FakeQrWithLogo size={120} />
          </div>

          <footer className="mt-12 border-t border-gray-200 pt-8">
            <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-black/50">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0 text-amber-500"
                fill="currentColor"
              >
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
              </svg>
              <span>
                Powered by National Marketers PLC, in partnership with Farka
                Technology
              </span>
            </p>
          </footer>
        </section>
      </main>

      <FloatingChat />
    </div>
  );
}
