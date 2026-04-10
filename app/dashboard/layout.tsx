"use client";

import { Suspense } from "react";
import { PushNotificationPopup } from "@/components/PushNotificationManager";
import RestrictedPopup from "@/components/RestrictedPopup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PushNotificationPopup />
      <Suspense fallback={null}>
        <RestrictedPopup />
      </Suspense>
    </>
  );
}
