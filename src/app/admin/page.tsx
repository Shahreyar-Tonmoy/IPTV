import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "IPTV Admin Dashboard",
};

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return <AdminDashboard username={session.username} />;
}
