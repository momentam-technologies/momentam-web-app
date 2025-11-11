"use client";
import React, { useEffect } from "react";
import dynamic from "next/dynamic";

const DynamicDashboardContent = dynamic(
  () => import("@/components/ui/dashboard"),
  { ssr: false }
);

export default function Dashboard() {
  return <DynamicDashboardContent />;
}
