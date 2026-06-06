// Trang đăng nhập admin — chỉ dùng email/password, không có Google, không có Sign Up
import { Suspense } from "react";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <SigninWithPassword />
      </div>
    </Suspense>
  );
}
