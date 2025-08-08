"use client";
import React, { useState, useEffect } from "react";
// import bcrypt from "bcryptjs";
// import { addAdminUser, getAdminUsers } from "@/lib/appwrite";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signUpUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SparklesCore } from "@/components/ui/sparkles";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  // useEffect(() => {
  //   const checkSuperAdminExists = async () => {
  //     const { admins } = await getAdminUsers(1, 0);
  //     if (admins.length > 0) {
  //       router.push("/login"); // Redirect to login if super admin already exists
  //     }
  //   };
  //   checkSuperAdminExists();
  // }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signUpUser(email, password, name);
      router.push("/login"); // Redirect to login after creation
    } catch (error) {
      setError("Failed to create super admin. Please try again.");
      console.error("Error creating super admin:", error);
    }
  };

  return (
    <div className="h-screen w-full bg-black flex px-2 items-center justify-center overflow-hidden">
      {/* Sparkles background */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="tsparticles"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Setup card */}
      <div className="max-w-md w-full mx-auto rounded-2xl p-4 md:p-8 shadow-lg bg-white/10 backdrop-blur-md relative z-10">
        <h2 className="font-bold text-xl text-white mb-2">Setup Super Admin</h2>
        <p className="text-white/80 text-sm max-w-sm mb-6">
          Create the initial super admin account to manage the system.
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <LabelInputContainer>
            <Label htmlFor="name" className="text-white">Name</Label>
            <Input
              id="name"
              placeholder="Your Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="email" className="text-white">Email Address</Label>
            <Input
              id="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </LabelInputContainer>

          <button
            className="bg-gradient-to-br relative group/btn from-black to-neutral-600 block w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]"
            type="submit"
          >
            Create Super Admin
            <BottomGradient />
          </button>
        </form>
      </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
