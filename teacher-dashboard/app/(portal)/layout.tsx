import TeacherFooter from "@/components/TeacherFooter";
import TeacherRouteGuard from "@/components/TeacherRouteGuard";
import TeacherTopBar from "@/components/TeacherTopBar";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <TeacherRouteGuard>
      <div className="flex min-h-screen flex-col bg-[#f1f5f9] font-[Arial,Helvetica,sans-serif] text-[#1a1a1a]">
        <TeacherTopBar />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-10 pt-[92px]">{children}</main>
        <TeacherFooter />
      </div>
    </TeacherRouteGuard>
  );
}
