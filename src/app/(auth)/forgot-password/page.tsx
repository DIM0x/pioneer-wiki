import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "找回密码 Recover password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot" />;
}
