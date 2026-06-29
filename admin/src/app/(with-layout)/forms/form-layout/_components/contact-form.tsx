import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export function ContactForm() {
  return (
    <ShowcaseSection title="Biểu mẫu liên hệ" className="p-6.5!">
      <form action="#">
        <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
          <InputGroup
            label="Tên"
            type="text"
            placeholder="Nhập tên của bạn"
            className="w-full xl:w-1/2"
          />

          <InputGroup
            label="Họ"
            type="text"
            placeholder="Nhập họ của bạn"
            className="w-full xl:w-1/2"
          />
        </div>

        <InputGroup
          label="Email"
          type="email"
          placeholder="Nhập địa chỉ email của bạn"
          className="mb-4.5"
          required
        />

        <InputGroup
          label="Tiêu đề"
          type="text"
          placeholder="Nhập tiêu đề"
          className="mb-4.5"
        />

        <Select
          label="Chủ đề"
          placeholder="Chọn chủ đề của bạn"
          className="mb-4.5"
          items={[
            { label: "Mỹ", value: "USA" },
            { label: "Anh", value: "UK" },
            { label: "Canada", value: "Canada" },
          ]}
        />

        <TextAreaGroup label="Tin nhắn" placeholder="Nhập tin nhắn của bạn" />

        <button className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90">
          Gửi tin nhắn
        </button>
      </form>
    </ShowcaseSection>
  );
}
