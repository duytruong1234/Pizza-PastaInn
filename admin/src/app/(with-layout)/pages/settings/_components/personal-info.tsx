// Personal info form — using auth context instead of Better Auth
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
    <ShowcaseSection title="Personal Information" className="p-7!">
      <div className="space-y-4">
        <InputGroup
          type="text"
          name="name"
          label="Name"
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
            label="Phone Number"
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
