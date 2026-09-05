// Layout chính cho các trang cần đăng nhập — có sidebar + header + AuthGuard
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { type PropsWithChildren } from "react";

export default function WithLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col bg-gray-2 dark:bg-[#020d1a] overflow-hidden">
          <Header />

          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8">
            <div className="isolate mx-auto w-full max-w-screen-2xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
