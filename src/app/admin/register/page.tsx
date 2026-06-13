import type { Metadata } from "next";
import RegisterAdminForm from "@/components/admin/RegisterAdminForm";

export const metadata: Metadata = {
  title: "Register Admin - IPTV Control",
};

export default function AdminRegisterPage() {
  return (
    <main className="admin-auth-page">
      <RegisterAdminForm />
    </main>
  );
}
