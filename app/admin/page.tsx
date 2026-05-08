import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";

const ADMIN_EMAIL = "hrithikghutke01@gmail.com";

export const metadata = {
  title: "Admin Dashboard — CrawlCube",
  robots: "noindex, nofollow",
};

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  if (email !== ADMIN_EMAIL) redirect("/");

  return <AdminDashboard />;
}
