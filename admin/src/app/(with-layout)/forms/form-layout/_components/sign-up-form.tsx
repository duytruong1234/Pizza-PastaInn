import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export function SignUpForm() {
  return (
    <ShowcaseSection title="Biểu mẫu đăng ký" className="p-6.5!">
      <form action="#">
        <InputGroup
          label="Họ tên"
          type="text"
          placeholder="Nhập họ và tên"
          className="mb-4.5"
        />

        <InputGroup
          label="Email"
          type="email"
          placeholder="Nhập địa chỉ email"
          className="mb-4.5"
        />

        <InputGroup
          label="Mật khẩu"
          type="password"
          placeholder="Nhập mật khẩu"
          className="mb-4.5"
        />

        <InputGroup
          label="Nhập lại mật khẩu"
          type="password"
          placeholder="Nhập lại mật khẩu"
          className="mb-5.5"
        />

        <button className="flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90">
          Đăng ký
        </button>
      </form>
    </ShowcaseSection>
  );
}
