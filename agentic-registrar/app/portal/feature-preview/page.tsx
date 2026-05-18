import Link from "next/link";
import type { Metadata } from "next";
import PortalFooter from "@/components/PortalFooter";
import PortalMainNav from "@/components/PortalMainNav";
import PortalSideMenu from "@/components/PortalSideMenu";
import PortalTopStrip from "@/components/PortalTopStrip";

export const metadata: Metadata = {
  title: "Feature Preview",
};

type FeaturePreviewPageProps = {
  searchParams: Promise<{ name?: string }>;
};

export default async function FeaturePreviewPage({ searchParams }: FeaturePreviewPageProps) {
  const params = await searchParams;
  const featureName = params.name ?? "Selected Feature";

  return (
    <div className="flex min-h-screen flex-col bg-[#f2f4f6] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
      <PortalTopStrip />
      <PortalMainNav />

      <main className="flex-1 py-[8px]">
        <div className="flex flex-col gap-5 md:flex-row">
          <PortalSideMenu />

          <section className="flex-1 px-3 md:ml-6 md:px-0">
            <div className="rounded-sm border border-[#c7d4df] bg-white pb-[60px] md:max-w-[995px]">
              <div className="rounded-t-sm bg-gradient-to-b from-[#71aee1] to-[#458dcc] px-4 py-2 text-[14px] text-white">
                Feature Preview
              </div>
              <div className="px-4 py-8 md:px-10 md:py-12">
                <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#2f78b7]">Coming Soon</p>
                <h1 className="mt-2 text-[24px] font-bold text-[#163b63] md:text-[30px]">{featureName}</h1>
                <p className="mt-4 text-[16px] text-[#1f2f40] md:text-[20px]">This Feature is not implemented yet</p>
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
