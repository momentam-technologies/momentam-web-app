"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  IconUser, IconBell, IconMoon, IconShield, IconLanguage, IconDeviceLaptop, 
  IconLock, IconMail, IconPhone, IconBrandGoogle, IconBrandApple, IconQrcode,
  IconDeviceMobile, IconAlertCircle, IconTrash, IconDownload
} from '@tabler/icons-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'account', label: 'Account Settings', icon: IconUser },
    { id: 'security', label: 'Security & Privacy', icon: IconLock },
    { id: 'notifications', label: 'Notifications', icon: IconBell },
    { id: 'appearance', label: 'Appearance', icon: IconMoon },
    { id: 'devices', label: 'Connected Devices', icon: IconDeviceLaptop },
    { id: 'data', label: 'Data & Storage', icon: IconDownload },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-neutral-900"
    >
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    Personal Information
                  </h2>
                  <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-neutral-700"></div>
                      <div>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                          Change Photo
                        </button>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          JPG, GIF or PNG. Max size of 800K
                        </p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-neutral-600 
                                   bg-white dark:bg-neutral-700 px-3 py-2 text-gray-900 dark:text-white 
                                   focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-neutral-600 
                                   bg-white dark:bg-neutral-700 px-3 py-2 text-gray-900 dark:text-white 
                                   focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-neutral-600 
                                   bg-white dark:bg-neutral-700 px-3 py-2 text-gray-900 dark:text-white 
                                   focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Language
                        </label>
                        <select
                          className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-neutral-600 
                                   bg-white dark:bg-neutral-700 px-3 py-2 text-gray-900 dark:text-white 
                                   focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option>English (US)</option>
                          <option>Swahili</option>
                          <option>Arabic</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-700/50 border-t border-gray-200 dark:border-neutral-600">
                  <div className="flex justify-end space-x-3">
                    <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-600 rounded-lg">
                      Cancel
                    </button>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security & Privacy */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          Two-Factor Authentication
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Connected Accounts */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Connected Accounts
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconBrandGoogle className="h-6 w-6 text-gray-400" />
                          <span className="ml-3 text-gray-900 dark:text-white">Google</span>
                        </div>
                        <button className="text-blue-500 hover:text-blue-600">Connect</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <IconBrandApple className="h-6 w-6 text-gray-400" />
                          <span className="ml-3 text-gray-900 dark:text-white">Apple</span>
                        </div>
                        <button className="text-blue-500 hover:text-blue-600">Connect</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-red-600">Danger Zone</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Once you delete your account, there is no going back.
                    </p>
                    <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add other tab contents here */}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;