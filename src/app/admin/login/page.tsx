import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login - IPTV Control",
};

export default function AdminLoginPage() {
  return (
    <main className="admin-auth-page">
      <LoginForm />
    </main>
  );
}
