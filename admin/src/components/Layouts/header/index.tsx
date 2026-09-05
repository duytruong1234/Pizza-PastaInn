// Header — thanh tiêu đề trên cùng của admin dashboard
"use client";


import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();

  return (
    <header className="border-stroke shadow-1 dark:border-stroke-dark dark:bg-gray-dark sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 md:px-5 lg:px-8">
      <button
        onClick={toggleSidebar}
        className="dark:border-stroke-dark rounded-lg border px-1.5 py-1 lg:hidden dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A]"
      >
        <MenuIcon />
        <span className="sr-only">Ẩn/Hiện Menu</span>
      </button>

      {isMobile && (
        <span className="2xsm:ml-4 ml-2 text-lg font-bold text-dark max-[430px]:hidden dark:text-white">
          Pizza&PastaInn
        </span>
      )}

      <div className="max-xl:hidden">
        <h1 className="text-xl text-dark mb-0.5 font-bold dark:text-white">
          Quản trị
        </h1>
        <p className="text-sm font-medium text-gray-500">Hệ thống quản trị Pizza & Pasta Inn</p>
      </div>

      <div className="2xsm:gap-4 flex flex-1 items-center justify-end gap-2">


        <ThemeToggleSwitch />

        <Notification />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
