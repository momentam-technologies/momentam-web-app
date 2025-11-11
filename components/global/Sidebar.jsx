"use client";
import React from "react";
import { Sidebar, SidebarBody, SidebarLink } from "../ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconUsers,
  IconCalendar,
  IconCamera,
  IconCurrencyDollar,
  IconFileText,
  IconChartBar,
  IconMessageCircle,
  IconBell,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from 'next/navigation';

export function SidebarDemo() {
  const pathname = usePathname();
  const links = [
    { label: "Dashboard", href: "/dashboard", icon: IconBrandTabler },
    { label: "Users", href: "/dashboard/users", icon: IconUsers },
    { label: "Photographers", href: "/dashboard/photographers", icon: IconCamera },
    { label: "Photos", href: "/dashboard/photos", icon: IconFileText },
    { label: "Bookings", href: "/dashboard/bookings", icon: IconCalendar },
    { label: "Finances", href: "/dashboard/finances", icon: IconCurrencyDollar },
    { label: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
    { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
    // { label: "Logout", href: "/logout", icon: IconArrowLeft },
  ];

  return (
    <Sidebar>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <Logo />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={{
                  ...link,
                  icon: <link.icon className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />,
                }}
                active={pathname === link.href}
              />
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 dark:bg-sky-500 rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-black dark:text-white whitespace-pre"
      >
        Head-Quarters
      </motion.span>
    </Link>
  );
};

export default SidebarDemo;
