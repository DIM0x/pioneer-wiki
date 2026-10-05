import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "验证邮箱 Verify email", robots: { index: false } };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const params = await searchParams;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  return <AuthForm mode="resend" email={email ?? ""} />;
}
