import { Alert } from "@/components/ui-elements/alert";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cảnh báo - Pizza & Pasta Inn Admin",
  // other metadata
};

export default function Page() {
  return (
    <>
      <Breadcrumb pageName="Cảnh báo" />

      <div className="space-y-7.5 rounded-[10px] bg-white p-4 shadow-1 dark:bg-gray-dark dark:shadow-card md:p-6 xl:p-9">
        <Alert
          variant="warning"
          title="Yêu cầu chú ý"
          description="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when"
        />

        <Alert
          variant="success"
          title="Gửi tin nhắn thành công"
          description="Lorem Ipsum is simply dummy text of the printing and typesetting industry."
        />

        <Alert
          variant="error"
          title="Có 1 lỗi xảy ra khi gửi thông tin"
          description="Lorem Ipsum is simply dummy text of the printing"
        />
      </div>
    </>
  );
}
