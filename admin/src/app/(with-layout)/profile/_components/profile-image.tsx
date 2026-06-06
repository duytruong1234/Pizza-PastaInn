// Profile Image Uploader — placeholder, does not use Better Auth
"use client";

import Image from "next/image";

type ProfileImageUploaderProps = {
  initialImage: string | null;
  name: string;
};

export function ProfileImageUploader({
  initialImage,
  name,
}: ProfileImageUploaderProps) {
  return (
    <div className="relative z-30 mx-auto -mt-22 h-30 w-full max-w-30 rounded-full bg-white/20 p-1 backdrop-blur sm:h-44 sm:max-w-44 sm:p-3">
      <div className="relative flex items-center justify-center drop-shadow-2">
        {initialImage ? (
          <Image
            src={initialImage}
            width={160}
            height={160}
            className="size-28 overflow-hidden rounded-full object-cover sm:size-40"
            alt={`${name} profile image`}
          />
        ) : (
          <span className="mx-auto flex size-40 items-center justify-center rounded-full bg-primary text-4xl font-bold text-white">
            {name?.charAt(0)?.toUpperCase() || "A"}
          </span>
        )}
      </div>
    </div>
  );
}
