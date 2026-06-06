// Settings page — admin personal info
"use client";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { useAuth } from "@/lib/auth-context";
import type { Metadata } from "next";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-270">
      <Breadcrumb pageName="Settings" />

      <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
        <h3 className="mb-5 text-lg font-bold text-dark dark:text-white">
          Personal Information
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Name</label>
            <p className="text-dark dark:text-white">{user?.username || "N/A"}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Email</label>
            <p className="text-dark dark:text-white">{user?.email || "N/A"}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">Role</label>
            <p className="text-dark dark:text-white capitalize">{user?.role || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
