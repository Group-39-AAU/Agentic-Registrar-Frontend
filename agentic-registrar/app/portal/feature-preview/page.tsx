import Link from "next/link";
import type { Metadata } from "next";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";

export const metadata: Metadata = {
  title: "Feature Preview",
};

type FeaturePreviewPageProps = {
  searchParams: Promise<{ name?: string }>;
};

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
          <p className="mt-1 ml-32 text-[16px] text-[#4a5a6a]">Seek wisdom, Elevate Your Intellect and Serve Humanity</p>
        </div>
      </div>
    </div>
  );
}

export default async function FeaturePreviewPage({ searchParams }: FeaturePreviewPageProps) {
  const params = await searchParams;
  const featureName = params.name ?? "Selected Feature";

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f4f6] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <TopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px]">
        <div className="flex gap-5">
          <PortalSideMenu />

          <section className="ml-6 flex-1">
            <div className="max-w-[995px] rounded-sm border border-[#c7d4df] bg-white pb-[60px]">
              <div className="rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#458dcc] px-4 py-2 text-[14px] text-white">
                Feature Preview
              </div>
              <div className="px-10 py-12">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2f78b7]">Coming Soon</p>
                <h1 className="mt-2 text-[30px] font-bold text-[#163b63]">{featureName}</h1>
                <p className="mt-4 text-[20px] text-[#1f2f40]">This Feature is not implemented yet</p>
                <div className="mt-8">
                  <Link
                    href="/portal/home"
                    className="inline-flex items-center rounded-full bg-[#2f78b7] px-6 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#255f93] hover:no-underline"
                  >
                    Back to Portal Home
                  </Link>
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
