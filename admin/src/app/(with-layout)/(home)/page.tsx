// Dashboard chính — trang tổng quan Pizza&PastaInn Admin
import { Suspense } from "react";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";

export default function Home() {
  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup />
      </Suspense>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-9 2xl:gap-7.5">
        <div className="col-span-12 rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h2 className="text-xl font-bold text-dark dark:text-white">
            Chào mừng đến với Pizza&PastaInn Admin
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Sử dụng menu bên trái để quản lý đơn hàng, thực đơn, khách hàng và
            nhiều hơn nữa.
          </p>
        </div>
      </div>
    </>
  );
}
