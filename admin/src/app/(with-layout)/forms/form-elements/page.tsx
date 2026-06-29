import type { Metadata } from "next";

import { GlobeIcon } from "@/assets/icons";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DatePickerOne from "@/components/FormElements/DatePicker/DatePickerOne";
import DatePickerTwo from "@/components/FormElements/DatePicker/DatePickerTwo";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import MultiSelect from "@/components/FormElements/MultiSelect";
import { Checkbox } from "@/components/FormElements/checkbox";
import { RadioInput } from "@/components/FormElements/radio";
import { Select } from "@/components/FormElements/select";
import { Switch } from "@/components/FormElements/switch";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";

export const metadata: Metadata = {
  title: "Thành phần biểu mẫu - Pizza & Pasta Inn Admin",
};

export default function FormElementsPage() {
  return (
    <>
      <Breadcrumb pageName="Thành phần biểu mẫu" />

      <div className="grid grid-cols-1 gap-9 sm:grid-cols-2">
        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Trường nhập liệu" className="space-y-5.5 p-6.5!">
            <InputGroup
              label="Trường nhập mặc định"
              placeholder="Văn bản nhập mặc định"
              type="text"
            />

            <InputGroup
              label="Trường nhập đang hoạt động"
              placeholder="Văn bản nhập đang hoạt động"
              active
              type="text"
            />

            <InputGroup
              label="Trường nhập bị vô hiệu hóa"
              placeholder="Văn bản nhập bị vô hiệu hóa"
              type="text"
              disabled
            />
          </ShowcaseSection>

          <ShowcaseSection
            title="Công tắc bật/tắt"
            className="space-y-5.5 p-6.5!"
          >
            <Switch />
            <Switch backgroundSize="sm" />
            <Switch withIcon />
            <Switch background="dark" />
          </ShowcaseSection>

          <ShowcaseSection title="Thời gian và ngày tháng" className="space-y-5.5 p-6.5!">
            <DatePickerOne />
            <DatePickerTwo />
          </ShowcaseSection>

          <ShowcaseSection title="Tải tập tin lên" className="space-y-5.5 p-6.5!">
            <InputGroup
              type="file"
              fileStyleVariant="style1"
              label="Đính kèm tập tin"
              placeholder="Đính kèm tập tin"
            />

            <InputGroup
              type="file"
              fileStyleVariant="style2"
              label="Đính kèm tập tin"
              placeholder="Đính kèm tập tin"
            />
          </ShowcaseSection>
        </div>

        <div className="flex flex-col gap-9">
          <ShowcaseSection title="Trường văn bản lớn (Textarea)" className="space-y-6 p-6.5!">
            <TextAreaGroup
              label="Trường văn bản lớn mặc định"
              placeholder="Nhập nội dung mặc định"
            />

            <TextAreaGroup
              label="Trường văn bản lớn đang hoạt động"
              placeholder="Nhập nội dung đang hoạt động"
              active
            />

            <TextAreaGroup
              label="Trường văn bản lớn bị vô hiệu hóa"
              placeholder="Nhập nội dung bị vô hiệu hóa"
              disabled
            />
          </ShowcaseSection>

          <ShowcaseSection title="Trường chọn (Select)" className="space-y-5.5 p-6.5!">
            <Select
              label="Chọn quốc gia"
              items={[
                { label: "Mỹ", value: "USA" },
                { label: "Anh", value: "UK" },
                { label: "Canada", value: "Canada" },
              ]}
              defaultValue="USA"
              prefixIcon={<GlobeIcon />}
            />
            <MultiSelect id="multiSelect" />
          </ShowcaseSection>

          <ShowcaseSection
            title="Hộp kiểm (Checkbox) và Nút chọn (Radio)"
            className="space-y-5.5 p-6.5!"
          >
            <Checkbox label="Văn bản hộp kiểm" />
            <Checkbox label="Văn bản hộp kiểm" withIcon="check" />
            <Checkbox label="Văn bản hộp kiểm" withIcon="x" />
            <RadioInput label="Văn bản nút chọn" />
            <RadioInput label="Văn bản nút chọn" variant="circle" />
          </ShowcaseSection>
        </div>
      </div>
    </>
  );
}
