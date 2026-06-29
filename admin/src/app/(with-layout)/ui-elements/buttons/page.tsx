import { MessageOutlineIcon } from "@/assets/icons";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Button } from "@/components/ui-elements/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nút bấm - Pizza & Pasta Inn Admin",
};

export default function Page() {
  return (
    <>
      <Breadcrumb pageName="Nút bấm" />

      <div className="space-y-10">
        <ShowcaseSection title="Nút bấm thường">
          <div className="mb-7.5 flex flex-wrap gap-5 xl:gap-20">
            <Button label="Nút bấm" variant="primary" />
            <Button label="Nút bấm" variant="primary" shape="rounded" />
            <Button label="Nút bấm" variant="primary" shape="full" />
            <Button label="Nút bấm" variant="outlinePrimary" shape="rounded" />
          </div>

          <div className="mb-7.5 flex flex-wrap gap-5 xl:gap-20">
            <Button label="Nút bấm" variant="success" />
            <Button label="Nút bấm" variant="success" shape="rounded" />
            <Button label="Nút bấm" variant="success" shape="full" />
            <Button label="Nút bấm" variant="outlineSuccess" shape="rounded" />
          </div>

          <div className="flex flex-wrap gap-5 xl:gap-20">
            <Button label="Nút bấm" variant="dark" />
            <Button label="Nút bấm" variant="dark" shape="rounded" />
            <Button label="Nút bấm" variant="dark" shape="full" />
            <Button label="Nút bấm" variant="outlineDark" shape="rounded" />
          </div>
        </ShowcaseSection>

        <ShowcaseSection title="Nút bấm có biểu tượng">
          <div className="mb-7.5 flex flex-wrap gap-5 xl:gap-7.5">
            <Button
              label="Nút kèm Icon"
              variant="primary"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="success"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="dark"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="outlinePrimary"
              size="small"
              icon={<MessageOutlineIcon />}
            />
          </div>

          <div className="mb-7.5 flex flex-wrap gap-5 xl:gap-7.5">
            <Button
              label="Nút kèm Icon"
              variant="primary"
              shape="rounded"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="success"
              shape="rounded"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="dark"
              shape="rounded"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="outlinePrimary"
              shape="rounded"
              size="small"
              icon={<MessageOutlineIcon />}
            />
          </div>

          <div className="flex flex-wrap gap-5 xl:gap-7.5">
            <Button
              label="Nút kèm Icon"
              variant="primary"
              shape="full"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="success"
              shape="full"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="dark"
              shape="full"
              size="small"
              icon={<MessageOutlineIcon />}
            />
            <Button
              label="Nút kèm Icon"
              variant="outlinePrimary"
              shape="full"
              size="small"
              icon={<MessageOutlineIcon />}
            />
          </div>
        </ShowcaseSection>
      </div>
    </>
  );
}
