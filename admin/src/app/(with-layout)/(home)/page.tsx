// Dashboard chính — trang tổng quan Pizza&PastaInn Admin
import { Suspense } from "react";
import { DashboardAnalytics } from "./_components/dashboard-analytics";
import { OverviewCardsGroup } from "./_components/overview-cards";
import { OverviewCardsSkeleton } from "./_components/overview-cards/skeleton";

export default function Home() {
  return (
    <>
      <Suspense fallback={<OverviewCardsSkeleton />}>
        <OverviewCardsGroup />
      </Suspense>

      <DashboardAnalytics />
    </>
  );
}
