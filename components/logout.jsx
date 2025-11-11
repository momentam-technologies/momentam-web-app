"use client";

import { signOut } from "next-auth/react";
import { toast } from "sonner";

export default function LogoutButton() {
    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: "/login" });
            toast.success("Logged Out Successfully");
        } catch (error) {
            console.error("Sign-out failed:", error);
            toast.error("Sign-out failed. Please try again.");
        }
    };

    return (
        <button
            onClick={handleSignOut}
            className="w-full text-left px-2.5 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
            Sign out
        </button>
    );
}