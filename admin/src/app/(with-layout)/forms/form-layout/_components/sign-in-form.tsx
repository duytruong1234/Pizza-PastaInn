import { Checkbox } from "@/components/FormElements/checkbox";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import Link from "next/link";

export function SignInForm() {
  return (
    <ShowcaseSection title="Biểu mẫu đăng nhập" className="p-6.5!">
      <form action="#">
        <InputGroup
          label="Email"
          type="email"
          placeholder="Nhập địa chỉ email của bạn"
          className="mb-4.5"
        />

        <InputGroup
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu của bạn"
        />

        <div className="mb-5.5 mt-5 flex items-center justify-between">
          <Checkbox label="Ghi nhớ đăng nhập" minimal withBg withIcon="check" />

          <Link href="#" className="text-body-sm text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        <button className="flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90">
          Đăng nhập
        </button>
      </form>
    </ShowcaseSection>
  );
}
