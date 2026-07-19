"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/login");
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
