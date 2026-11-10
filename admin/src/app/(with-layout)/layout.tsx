// Layout chính cho các trang cần đăng nhập — có sidebar + header + AuthGuard
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { type PropsWithChildren } from "react";

export default function WithLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <div className="fixed inset-0 flex h-dvh w-full overflow-hidden bg-gray-2 dark:bg-[#020d1a]">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-2 dark:bg-[#020d1a]">
          <Header />

          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-3 sm:p-4 md:p-6 xl:p-7">
            <div className="isolate mx-auto min-w-0 w-full max-w-screen-2xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
