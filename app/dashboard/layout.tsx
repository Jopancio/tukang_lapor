"use client";

import { PushNotificationPopup } from "@/components/PushNotificationManager";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PushNotificationPopup />
    </>
  );
}
