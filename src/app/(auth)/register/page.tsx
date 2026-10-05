import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "登记账号 Register", robots: { index: false } };

export default function RegisterPage() {
  return <AuthForm mode="signup" />;
}
