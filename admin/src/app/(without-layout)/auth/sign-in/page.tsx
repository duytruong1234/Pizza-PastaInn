// Trang đăng nhập admin Pizza&PastaInn
import Signin from "@/components/Auth/Signin";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Đăng nhập - Pizza&PastaInn Admin",
};

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-wrap items-center">
      <div className="w-full xl:w-1/2">
        <div className="mx-auto w-[570px] p-4 sm:p-12.5 xl:p-15">
          <Signin />
        </div>
      </div>

      <div className="hidden w-full p-6 xl:block xl:w-1/2">
        <div className="custom-gradient-1 overflow-hidden rounded-2xl px-15 pt-12.5 dark:bg-dark-2! dark:bg-none">
          <div className="mb-10 inline-block">
            <h2 className="text-2xl font-bold text-dark dark:text-white">
              Pizza&PastaInn
            </h2>
          </div>
          <p className="mb-3 text-xl font-medium text-dark dark:text-white">
            Đăng nhập quản trị
          </p>

          <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
            Chào mừng trở lại!
          </h1>

          <p className="w-full max-w-[375px] font-medium text-dark-4 dark:text-dark-6">
            Vui lòng đăng nhập bằng tài khoản admin để quản lý hệ thống
            Pizza&PastaInn
          </p>

          <div className="mt-31">
            <Image
              src={"/images/grids/grid-02.svg"}
              alt="Background"
              width={405}
              height={325}
              className="mx-auto dark:opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
