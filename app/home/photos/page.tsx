import { ModeToggle } from '@/components/theme'
import React from 'react'

export default function Photos() {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-black">
            {/* Topbar inside content area (excluding sidebar) */}
            <div className="flex justify-between mr-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                <p className="ml-4 text-2xl font-semibold">Manage and review photos by bookings</p>
                <ModeToggle />
            </div>


        </div>
    )
}
