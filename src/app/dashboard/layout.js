"use client";
import { redirect } from "next/navigation";
import Sidebar from "@/components/global/Sidebar";
import Navbar from "@/components/global/Navbar";
import Footer from "@/components/global/Footer";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardLayout({ children }) {
  const authenticated = isAuthenticated();
  if (!authenticated) redirect("/login");

  return (
    <div className="flex flex-col h-screen bg-neutral-800">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
