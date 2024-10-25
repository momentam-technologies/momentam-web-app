"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SparklesCore } from "@/components/ui/sparkles";
import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 800);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log('Attempting login with email:', email);
      const result = await loginUser(email, password);
      console.log('Login result:', result);
      if (result.success) {
        console.log('Login successful, redirecting to dashboard');
        router.push("/dashboard");
      } else {
        console.error('Login failed:', result.error);
        setError(result.error || "Invalid email or password");
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setError("An unexpected error occurred during login. Please try again.");
    }
  };

  if (isSmallScreen) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-2xl font-bold mb-2 text-white">Notice</h2>
          <p className="text-lg text-white">
            Momentam HQ can be accessed by computer screens and not small screens. Kindly switch to a larger device.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black flex px-2 items-center justify-center overflow-hidden">
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

      <div className="max-w-md w-full mx-auto rounded-2xl p-4 md:p-8 shadow-lg bg-white/10 backdrop-blur-md relative z-10">
        <h2 className="font-bold text-xl text-white mb-2">
          Welcome to Momentam HQ
        </h2>
        <p className="text-white/80 text-sm max-w-sm mb-6">
          Login to access the Momentam system
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

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
