// Form thông tin cá nhân — dùng auth context thay vì Better Auth
"use client";

import {
  CallIcon,
  EmailIcon,
  UserIcon,
} from "@/assets/icons";
import InputGroup from "@/components/FormElements/InputGroup";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/lib/auth-context";

export interface UserInfo {
  name: string;
  phoneNumber?: string;
  email: string;
  bio?: string;
}

export function PersonalInfoForm(personalInfo: UserInfo) {
  return (
    <ShowcaseSection title="Thông tin cá nhân" className="p-7!">
      <div className="space-y-4">
        <InputGroup
          type="text"
          name="name"
          label="Tên"
          value={personalInfo.name}
          icon={<UserIcon />}
          iconPosition="left"
          height="sm"
          disabled
        />

        <InputGroup
          type="email"
          name="email"
          label="Email"
          value={personalInfo.email}
          icon={<EmailIcon />}
          iconPosition="left"
          height="sm"
          disabled
        />

        {personalInfo.phoneNumber && (
          <InputGroup
            type="text"
            name="phoneNumber"
            label="Số điện thoại"
            value={personalInfo.phoneNumber}
            icon={<CallIcon />}
            iconPosition="left"
            height="sm"
            disabled
          />
        )}
      </div>
    </ShowcaseSection>
  );
}
