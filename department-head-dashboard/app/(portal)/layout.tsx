import AdminFooter from "@/components/AdminFooter";
import AdminRouteGuard from "@/components/AdminRouteGuard";
import AdminTopBar from "@/components/AdminTopBar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRouteGuard>
      <div className="flex min-h-screen flex-col bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
        <AdminTopBar />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-10 pt-[92px]">{children}</main>
        <AdminFooter />
      </div>
    </AdminRouteGuard>
  );
}
