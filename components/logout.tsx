"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function LogoutButton() {

    const handleSignOut = async () => {
        try {
            await signOut({ callbackUrl: "/auth/login" });
            toast.success("Logged Out Successfully")
        } catch (error) {
            console.error("Sign-out failed:", error);
            toast.error("Sign-out failed. Please try again.")
        }
    }

    return (
        <Button variant="destructive" onClick={handleSignOut} className="w-full cursor-pointer">Sign out</Button >
    );
}