"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SparklesCore } from "@/components/ui/sparkles";
// Remove or replace this import if you don't have a Momentam icon component
// import { IconBrandMomentum } from "@tabler/icons-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login attempt with:", email, password);
    // TODO: Implement actual login logic here
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

      {/* Login card */}
      <div className="max-w-md w-full mx-auto rounded-2xl p-4 md:p-8 shadow-lg bg-white/10 backdrop-blur-md relative z-10">
        <h2 className="font-bold text-xl text-white mb-2">
          Welcome to Momentam HQ
        </h2>
        <p className="text-white/80 text-sm max-w-sm mb-6">
          Login to access the Momentam administration system
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
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
            Sign In
            <BottomGradient />
          </button>
        </form>

        <p className="text-sm text-center text-white/60 mt-6">
          Need assistance? Contact the system administrator.
        </p>
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
