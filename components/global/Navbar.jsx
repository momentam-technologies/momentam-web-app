"use client";
import React, { useState, useEffect, useRef } from 'react';
import { IconUser, IconSearch, IconChevronDown, IconSettings, IconLogout, IconSun, IconMoon } from '@tabler/icons-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import LogoutButton from '../logout';
import { getSession } from "next-auth/react";


const Navbar = () => {
  const [session, setSession] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMessageDropdownOpen, setIsMessageDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
    };
    fetchSession();
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMessageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <header className="bg-neutral-100 dark:bg-neutral-800 shadow-md p-4 flex justify-between items-center transition-colors duration-200">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white mr-8">Momentam HQ</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search here..."
            className="pl-10 pr-4 py-1 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" size={18} />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
        >
          {theme === 'dark' ? <IconSun size={24} /> : <IconMoon size={24} />}
        </button>
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <IconUser size={20} className="text-gray-600 dark:text-gray-300" />
            </div>
            <span className="font-medium">{session?.user?.email || "Admin"}</span>
            <IconChevronDown size={20} />
          </button>
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
              <Link href="/dashboard/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <IconSettings className="inline-block mr-2" size={16} />
                Settings
              </Link>
              <div className="flex flex-row items-center pl-3 py-2">
                <IconLogout className="text-gray-700 dark:text-gray-300 ml-1.5" size={16} />
                <LogoutButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
