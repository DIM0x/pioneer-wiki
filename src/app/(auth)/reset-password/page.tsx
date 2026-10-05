import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "重置密码 Reset password", robots: { index: false } };

export default function ResetPasswordPage() {
  return <AuthForm mode="reset" />;
}
