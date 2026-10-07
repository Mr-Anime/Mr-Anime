import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your Mr.Anime password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="We'll email you a secure link to set a new one."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
