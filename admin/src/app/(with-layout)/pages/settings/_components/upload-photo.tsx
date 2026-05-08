// Upload photo — placeholder, không dùng Better Auth
"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";

type UploadPhotoFormProps = {
  initialImage: string | null;
};

export function UploadPhotoForm({ initialImage }: UploadPhotoFormProps) {
  return (
    <ShowcaseSection title="Ảnh đại diện" className="p-7!">
      <div className="flex items-center justify-center py-8">
        <div className="flex size-24 items-center justify-center rounded-full bg-gray-2 text-2xl font-bold text-dark dark:bg-dark-2 dark:text-white">
          A
        </div>
      </div>
      <p className="text-center text-sm text-gray-500">
        Chức năng cập nhật ảnh sẽ được bổ sung sau.
      </p>
    </ShowcaseSection>
  );
}
