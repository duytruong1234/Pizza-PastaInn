// Profile Page — using auth context instead of Better Auth
"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/lib/auth-context";
import Image from "next/image";

export default function Page() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-242.5">
      <Breadcrumb pageName="Profile" />

      <div className="overflow-hidden rounded-[10px] bg-white shadow-1 dark:bg-gray-dark dark:shadow-card">
        <div className="relative z-20 h-35 md:h-65">
          <Image
            src="/images/cover/cover-01.png"
            alt="profile cover"
            className="h-full w-full rounded-tl-[10px] rounded-tr-[10px] object-cover object-center"
            width={970}
            height={260}
            style={{ width: "auto", height: "auto" }}
          />
        </div>
        <div className="px-4 pb-6 text-center lg:pb-8 xl:pb-11.5">
          <div className="relative z-30 mx-auto -mt-22 flex h-30 w-full max-w-30 items-center justify-center rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
            <span className="flex size-28 items-center justify-center rounded-full bg-primary text-4xl font-bold text-white sm:size-40">
              {user?.username?.charAt(0)?.toUpperCase() || "A"}
            </span>
          </div>
          <div className="mt-4">
            <h3 className="mb-1 text-heading-6 font-bold text-dark dark:text-white">
              {user?.username || "Admin"}
            </h3>
            <p className="font-medium capitalize">{user?.role || "admin"}</p>

            <div className="mx-auto mt-5 mb-5.5 grid max-w-92.5 grid-cols-2 rounded-[5px] border border-stroke py-2.25 shadow-1 dark:border-dark-3 dark:bg-dark-2 dark:shadow-card">
              <div className="flex flex-col items-center justify-center gap-1 border-r border-stroke px-4 dark:border-dark-3">
                <span className="text-body-sm">Email</span>
                <span className="font-medium text-dark dark:text-white text-sm">
                  {user?.email || "N/A"}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 px-4">
                <span className="text-body-sm">Role</span>
                <span className="font-medium text-dark dark:text-white capitalize">
                  {user?.role || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
